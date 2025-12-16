// frontend/src/pages/Meetings/MeetingDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowLeft, Video } from 'lucide-react';
import meetingsService from '../../services/meetings.service';
import { Meeting } from '../../types/meetings.types';
import Loader from '../../components/common/Loader';
import { formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import VideoRoom from '../../components/VideoRoom';

const MeetingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const data = await meetingsService.getMeetingById(id);
        if (!data) {
          showToast.error('Meeting not found');
          navigate('/meetings');
          return;
        }
        setMeeting(data);
      } catch (e) {
        showToast.error('Failed to load meeting');
        navigate('/meetings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const openJoinLink = (joinLink: string) => {
    // Prefer Google Meet URLs
    if (joinLink.startsWith('https://meet.google.com')) {
      window.open(joinLink, '_blank', 'noopener,noreferrer');
      return;
    }

    // Internal link under same origin
    if (joinLink.startsWith(window.location.origin)) {
      const path = joinLink.replace(window.location.origin, '');
      navigate(path);
      return;
    }

    // Relative path
    if (joinLink.startsWith('/')) {
      navigate(joinLink);
      return;
    }

    // Any other external URL
    window.open(joinLink, '_blank', 'noopener,noreferrer');
  };

  const handleJoin = async () => {
    if (!id || !meeting) return;

    // If there is any joinLink (Google or internal), use it directly
    if (meeting.joinLink) {
      openJoinLink(meeting.joinLink);
      return;
    }

    // Otherwise, go through backend join + internal VideoRoom
    setJoining(true);
    try {
      const ok = await meetingsService.joinMeeting(id);
      if (ok) {
        showToast.success('Joined meeting');
        setShowVideo(true);
      } else {
        showToast.error('Unable to join meeting');
      }
    } catch (e) {
      showToast.error('Failed to join meeting');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader text="Loading meeting..." />
      </div>
    );
  }

  if (!meeting) {
    return null;
  }

  const canJoin =
    !!meeting.joinLink ||
    meeting.mode === 'instant' ||
    meeting.status === 'live' ||
    meeting.status === 'ongoing';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{meeting.title}</h1>
              {meeting.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {meeting.description}
                </p>
              )}

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatDateTime(meeting.startTime)}</span>
                </div>
                {meeting.endTime && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{formatDateTime(meeting.endTime)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>{meeting.attendees?.length || 0} attendees</span>
                </div>
              </div>

              {meeting.location && (
                <p className="text-sm">
                  <span className="font-semibold">Location: </span>
                  {meeting.location}
                </p>
              )}

              {meeting.joinLink && (
                <p className="mt-2 text-sm break-all">
                  <span className="font-semibold">Join link: </span>
                  <a
                    href={meeting.joinLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline"
                  >
                    {meeting.joinLink}
                  </a>
                </p>
              )}
            </div>

            {canJoin && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                <Video size={16} />
                {joining ? 'Joining...' : 'Join meeting'}
              </button>
            )}
          </div>
        </div>

        {showVideo && user?._id && meeting._id && (
          <VideoRoom
            meetingId={meeting._id}
            userId={user._id}
            token={localStorage.getItem('token') || undefined}
          />
        )}
      </div>
    </div>
  );
};

export default MeetingDetails;
