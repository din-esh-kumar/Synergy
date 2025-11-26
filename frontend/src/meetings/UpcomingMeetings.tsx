import React from 'react';
import { Meeting } from '../types/meetings.types';
import { Calendar, Clock, Users, ExternalLink } from 'lucide-react';

interface Props {
  meetings: Meeting[];
}

const UpcomingMeetings: React.FC<Props> = ({ meetings }) => {
  const statusColor = (status?: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ongoing': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  if (meetings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar size={32} className="mx-auto mb-2 opacity-30" />
        <p>No upcoming meetings</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.map((meeting) => (
        <div key={meeting._id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:border-blue-500/50 transition-all duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-white">{meeting.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColor(meeting.status)}`}>
                  {meeting.status || 'upcoming'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {meeting.startTime ? new Date(meeting.startTime).toLocaleString() : 'TBD'}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {meeting.attendees?.length || 0} attendees
                </span>
              </div>
            </div>
            {meeting.joinLink && (
              <a href={meeting.joinLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingMeetings;
