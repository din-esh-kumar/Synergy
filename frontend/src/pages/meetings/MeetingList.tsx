import React from 'react';
import { Meeting } from '../../types/meetings.types';
import { Edit, Trash2, LogIn, Calendar, Clock, User, MapPin, Users } from 'lucide-react';

interface Props {
  meeting: Meeting;
  currentUserId?: string;
  onEdit: () => void;
  onDelete: () => void;
  onJoin: () => void;
}

const MeetingList: React.FC<Props> = ({ meeting, currentUserId, onEdit, onDelete, onJoin }) => {
  const statusColor = {
    upcoming: 'bg-blue-500/20 text-blue-300',
    scheduled: 'bg-blue-500/20 text-blue-300',
    ongoing: 'bg-green-500/20 text-green-300',
    completed: 'bg-gray-500/20 text-gray-300',
  };

  const isOrganizer = meeting.organizer === currentUserId;
  const invitedCount = Array.isArray(meeting.invitedUsers) ? meeting.invitedUsers.length : 0;

  return (
    <div className="bg-slate-800 dark:bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{meeting.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[meeting.status as keyof typeof statusColor] || statusColor.scheduled}`}>
              {meeting.status || 'scheduled'}
            </span>
            {isOrganizer && <span className="px-2 py-1 text-xs bg-purple-600/30 text-purple-300 rounded-full">Organizer</span>}
          </div>
          <p className="text-gray-400 text-sm mb-3">{meeting.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Calendar size={16} />
              {meeting.startTime ? new Date(meeting.startTime).toLocaleDateString() : 'TBD'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {meeting.startTime ? new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin size={16} />
                {meeting.location}
              </span>
            )}
            {meeting.organiserName && (
              <span className="flex items-center gap-1">
                <User size={16} />
                {meeting.organiserName}
              </span>
            )}
            {invitedCount > 0 && (
              <span className="flex items-center gap-1">
                <Users size={16} />
                {invitedCount} invited
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          {!isOrganizer && (
            <button
              onClick={onJoin}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">Join</span>
            </button>
          )}
          {isOrganizer && (
            <>
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Edit size={18} />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingList;
