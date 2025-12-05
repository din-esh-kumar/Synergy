import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');

    if (!socket && userId) {
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        query: { userId },
        reconnection: true,
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  return {
    socket,
    isConnected,
    joinTeamChat: (teamId: string) => socket?.emit('join-team-chat', teamId),
    joinProjectChat: (projectId: string) =>
      socket?.emit('join-project-chat', projectId),
    joinTaskChat: (taskId: string) => socket?.emit('join-task-chat', taskId),
    sendMessage: (content: string, roomId: string, roomType: string, attachments?: any[]) =>
      socket?.emit('send-message', {
        content,
        roomId,
        roomType,
        attachments,
      }),
    typing: (roomId: string) => socket?.emit('typing', { roomId }),
    stoppedTyping: (roomId: string) => socket?.emit('stopped-typing', { roomId }),
    onMessage: (callback: (data: any) => void) => {
      if (socket) socket.on('message', callback);
    },
    onNotification: (callback: (data: any) => void) => {
      if (socket) socket.on('notification', callback);
    },
  };
}
