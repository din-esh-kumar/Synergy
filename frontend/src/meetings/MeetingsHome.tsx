import React, { useEffect, useState } from 'react';
import { useMeetings } from '../hooks/useMeetings';
import MeetingCalendar from './MeetingCalendar';
import MeetingForm from './MeetingForm';
import MeetingList from './MeetingList';

const MeetingsHome: React.FC = () => {
  const { meetings, loading, error, fetchMeetings, createMeeting, deleteMeeting } = useMeetings();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCreateMeeting = async (data: any) => {
    try {
      await createMeeting(data);
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && meetings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading meetings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <div className="flex gap-4">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md ${
                viewMode === 'calendar' ? 'bg-white shadow-sm' : 'bg-transparent'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'bg-transparent'}`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Meeting
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

      {viewMode === 'calendar' ? (
        <MeetingCalendar meetings={meetings} />
      ) : (
        <MeetingList meetings={meetings} onDelete={deleteMeeting} />
      )}

      {showForm && <MeetingForm onSubmit={handleCreateMeeting} onClose={() => setShowForm(false)} />}
    </div>
  );
};

export default MeetingsHome;
