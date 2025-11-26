import React from 'react';
import { Meeting } from '../types/meetings.types';

interface Props {
  meetings: Meeting[];
}

const UpcomingMeetings: React.FC<Props> = ({ meetings }) => (
  <div>
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Upcoming Meetings</h2>
    {meetings.length === 0 ? (
      <div>No upcoming meetings.</div>
    ) : (
      <ul>
        {meetings.map(meeting => (
          <li key={meeting._id} className="mb-2">
            <span className="font-bold">{meeting.title}</span>
            {' — '}
            {new Date(meeting.startTime).toLocaleString()}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default UpcomingMeetings;
