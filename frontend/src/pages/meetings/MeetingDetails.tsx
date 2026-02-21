import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import meetingsService from '../../services/meetings.service';
import { Meeting } from '../../types/meetings.types';
import Loader from '../../components/common/Loader';
import { formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';

const MeetingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const data = await meetingsService.getMeetingById(id);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
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
      </div>
    </div>
  );
};

export default MeetingDetails;
