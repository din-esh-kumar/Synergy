import React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { Meeting } from '../../types/meetings.types';

interface Props {
  meetings: Meeting[];
}

const UpcomingMeetings: React.FC<Props> = ({ meetings }) => {
  const now = new Date();

  const upcoming = meetings
    .filter((m) => {
      if (!m.startTime) return false;
      const start = new Date(m.startTime);
      if (isNaN(start.getTime())) return false;
      // only future meetings
      return start > now;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, 5);

  return (
    <div className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 h-full">
      <div className="flex items-center justify-between mb  -4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" />
          Upcoming Meetings
        </h3>
      </div>

      {upcoming.length === 0 ? (
        <div className="mt-6 text-center text-sm text-gray-500">
          No upcoming meetings scheduled.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {upcoming.map((meeting) => {
            const start = new Date(meeting.startTime);
            const end = meeting.endTime ? new Date(meeting.endTime) : null;

            return (
              <div
                key={meeting._id}
                className="p-3 rounded-lg bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm truncate">
                      {meeting.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {start.toLocaleDateString()} ,{' '}
                        {start.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {end &&
                          ` - ${end.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {meeting.attendees?.length || 0} attendees
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    scheduled
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingMeetings;
