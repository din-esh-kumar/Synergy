// frontend/src/components/VideoRoom.tsx
import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

interface VideoRoomProps {
  meetingId: string;
  token?: string;      // optional auth token if your backend expects it
  userId: string;      // current user id (for signaling)
}

const VideoRoom: React.FC<VideoRoomProps> = ({ meetingId, token, userId }) => {
  const [connected, setConnected] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // -----------------------------
  // Setup Socket + Media on mount
  // -----------------------------
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token, userId },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-meeting', meetingId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      cleanup();
    });

    // Signaling handlers
    socket.on('webrtc-offer', async (payload: any) => {
      await handleReceiveOffer(payload);
    });

    socket.on('webrtc-answer', async (payload: any) => {
      await handleReceiveAnswer(payload);
    });

    socket.on('webrtc-ice', async (candidate: RTCIceCandidateInit) => {
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    });

    socket.on('meeting-ended', () => {
      setInCall(false);
      cleanup();
    });

    return () => {
      socket.emit('leave-meeting', meetingId);
      socket.disconnect();
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, token, userId]);

  // -----------------------------
  // Helpers
  // -----------------------------
  const setupMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err: any) {
      console.error('Error accessing media devices', err);
      setError('Could not access camera/microphone');
      throw err;
    }
  };

  const createPeer = () => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-ice', {
          meetingId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    // attach local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });
    }

    peerRef.current = pc;
    return pc;
  };

  const cleanup = () => {
    peerRef.current?.close();
    peerRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // -----------------------------
  // Call flow
  // -----------------------------
  const startCall = async () => {
    try {
      await setupMedia();
      const pc = createPeer();

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit('webrtc-offer', {
        meetingId,
        from: userId,
        sdp: offer,
      });

      setInCall(true);
    } catch {
      // error state already set in setupMedia if needed
    }
  };

  const handleReceiveOffer = async (payload: any) => {
    try {
      if (!localStreamRef.current) {
        await setupMedia();
      }
      const pc = createPeer();

      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('webrtc-answer', {
        meetingId,
        from: userId,
        sdp: answer,
      });

      setInCall(true);
    } catch (e) {
      console.error('Error handling offer', e);
    }
  };

  const handleReceiveAnswer = async (payload: any) => {
    try {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(payload.sdp),
      );
    } catch (e) {
      console.error('Error handling answer', e);
    }
  };

  const handleLeave = () => {
    socketRef.current?.emit('leave-meeting', meetingId);
    setInCall(false);
    cleanup();
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-300 bg-slate-900/90 p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Video room</h2>
          <p className="text-xs text-slate-300">
            Meeting: {meetingId} • {connected ? 'Connected' : 'Connecting...'}
          </p>
        </div>
        <div className="flex gap-2">
          {!inCall ? (
            <button
              onClick={startCall}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-700"
              disabled={!connected}
            >
              Start / Join
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/20 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center rounded-md bg-black/60 p-2">
          <span className="mb-1 text-xs text-slate-300">You</span>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-48 w-full rounded-md bg-black object-cover"
          />
        </div>
        <div className="flex flex-col items-center rounded-md bg-black/60 p-2">
          <span className="mb-1 text-xs text-slate-300">Remote</span>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-48 w-full rounded-md bg-black object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
