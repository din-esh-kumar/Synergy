import React, { useState } from 'react';
import { Meeting } from '../../types/meetings.types';

interface Props {
  meetings: Meeting[];
}

const MeetingCalendar: React.FC<Props> = ({ meetings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.startTime);
      return (
        meetingDate.getDate() === date.getDate() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDate(null);
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDate(null);
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const today = new Date();
  const selectedMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl p-5 md:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg
                       bg-slate-100 text-slate-700 hover:bg-slate-200
                       dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700
                       border border-slate-200 dark:border-slate-600
                       text-sm font-medium transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDate(new Date());
            }}
            className="hidden sm:inline-flex items-center justify-center px-3 py-2 rounded-lg
                       bg-blue-600 text-white hover:bg-blue-700
                       text-sm font-medium transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg
                       bg-slate-100 text-slate-700 hover:bg-slate-200
                       dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700
                       border border-slate-200 dark:border-slate-600
                       text-sm font-medium transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekday names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-xs md:text-sm text-slate-500 dark:text-slate-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells before month start */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="h-24 rounded-xl bg-slate-100/60 dark:bg-slate-800/40"
          />
        ))}

        {/* Actual days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          );
          const dayMeetings = getMeetingsForDate(date);
          const isTodayFlag = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);

          return (
            <button
              type="button"
              key={day}
              onClick={() => setSelectedDate(date)}
              className={`
                h-24 w-full text-left rounded-xl border p-2 flex flex-col
                transition-colors overflow-hidden group
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                    : isTodayFlag
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/20'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                }
                hover:border-blue-500 hover:bg-blue-50/70 dark:hover:bg-blue-500/10
              `}
            >
              <div
                className={`
                  font-semibold text-xs mb-1 flex items-center justify-between
                  ${isTodayFlag ? 'text-blue-600 dark:text-blue-300' : ''}
                `}
              >
                <span>{day}</span>
                {isTodayFlag && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-300 dark:bg-blue-500/20">
                    Today
                  </span>
                )}
              </div>

              <div className="space-y-1 flex-1">
                {dayMeetings.slice(0, 2).map((meeting) => (
                  <div
                    key={meeting._id}
                    className="text-[10px] md:text-xs bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-100 px-2 py-1 rounded-md truncate"
                    title={meeting.title}
                  >
                    {new Date(meeting.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    {meeting.title}
                  </div>
                ))}
                {dayMeetings.length > 2 && (
                  <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                    +{dayMeetings.length - 2} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day details */}
      {selectedDate && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">
              Meetings on{' '}
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
            {selectedMeetings.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedMeetings.length} meeting
                {selectedMeetings.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {selectedMeetings.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No meetings scheduled for this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedMeetings
                .slice()
                .sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
                )
                .map((meeting) => (
                  <div
                    key={meeting._id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs md:text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate">
                        {meeting.title}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {new Date(meeting.startTime).toLocaleTimeString(
                          'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}{' '}
                        -{' '}
                        {new Date(meeting.endTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {meeting.location && (
                      <span className="ml-3 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                        {meeting.location}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetingCalendar;
