import React from 'react';
import { Meeting } from '../../types/meetings.types';
import {
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  MapPin,
  Users,
  Video,
} from 'lucide-react';

interface Props {
  meeting: Meeting;
  currentUserId?: string;
  currentUserRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  onEdit: () => void;
  onDelete: () => void;
  onJoin: () => void;
}

const statusStyles: Record<string, { badge: string; label: string }> = {
  scheduled: {
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    label: 'Scheduled',
  },
  upcoming: {
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    label: 'Upcoming',
  },
  ongoing: {
    badge:
      'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    label: 'Ongoing',
  },
  completed: {
    badge:
      'bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300',
    label: 'Completed',
  },
};

const MeetingList: React.FC<Props> = ({
  meeting,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
  onJoin,
}) => {
  const statusKey = (meeting.status || 'scheduled').toLowerCase();
  const status = statusStyles[statusKey] || statusStyles.scheduled;

  const isOrganizer =
    typeof meeting.organizer === 'string'
      ? meeting.organizer === currentUserId
      : (meeting.organizer as any)?._id === currentUserId;

  const invitedCount = Array.isArray(meeting.invitedUsers)
    ? meeting.invitedUsers.length
    : 0;

  const start = meeting.startTime ? new Date(meeting.startTime) : null;
  const end = meeting.endTime ? new Date(meeting.endTime) : null;
  const now = new Date();

  const canJoin =
    !!meeting.joinLink &&
    !!start &&
    (!!end ? start <= now && now <= end : start <= now);

  const canManage =
  currentUserRole === 'ADMIN' || isOrganizer;


  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-all">
      {/* Header row: title + status badge + organizer badge */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {meeting.title}
          </h3>
          {meeting.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {meeting.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.badge}`}
          >
            {status.label}
          </span>
          {isOrganizer && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
              Organizer
            </span>
          )}
        </div>
      </div>

      {/* Meta information row */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
        {start && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{start.toLocaleDateString()}</span>
          </div>
        )}

        {start && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>
              {start.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {end && (
                <>
                  {' - '}
                  {end.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </span>
          </div>
        )}

        {meeting.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{meeting.location}</span>
          </div>
        )}

        {meeting.organiserName && (
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>{meeting.organiserName}</span>
          </div>
        )}

        {invitedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{invitedCount} invited</span>
          </div>
        )}
      </div>

      {/* Action buttons row */}
      <div className="flex items-center gap-2">
        {/* Join button */}
        {meeting.joinLink && (
          <button
            onClick={onJoin}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              canJoin
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <Video className="w-4 h-4" />
            {canJoin ? 'Join' : 'Not started'}
          </button>
        )}

        {/* Edit & Delete icons (compact) */}
        {canManage && (
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={onEdit}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all"
              title="Edit meeting"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all"
              title="Delete meeting"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingList;
