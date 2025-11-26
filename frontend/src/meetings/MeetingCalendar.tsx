import React, { useState } from 'react';
import { Meeting } from '../types/meetings.types';

interface Props {
  meetings: Meeting[];
}

const MeetingCalendar: React.FC<Props> = ({ meetings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            ←
          </button>
          <button onClick={nextMonth} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="h-24 bg-gray-50 rounded"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayMeetings = getMeetingsForDate(date);
          const isToday =
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear();

          return (
            <div
              key={day}
              className={`h-24 border rounded p-2 ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}
            >
              <div className="font-semibold text-sm mb-1">{day}</div>
              <div className="space-y-1">
                {dayMeetings.slice(0, 2).map((meeting) => (
                  <div
                    key={meeting._id}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate"
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
                  <div className="text-xs text-gray-500">+{dayMeetings.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MeetingCalendar;
