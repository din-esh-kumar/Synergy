import React from 'react';
import { Meeting } from '../types/meetings.types';

interface Props {
  meetings: Meeting[];
  onDelete: (id: string) => Promise<void>;
}

const MeetingList: React.FC<Props> = ({ meetings, onDelete }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {meetings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No meetings found</div>
      ) : (
        meetings.map((meeting) => (
          <div key={meeting._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{meeting.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                    {meeting.status}
                  </span>
                </div>
                {meeting.description && <p className="text-gray-600 mb-3">{meeting.description}</p>}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Start:</span>
                    <span>{formatDate(meeting.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">End:</span>
                    <span>{formatDate(meeting.endTime)}</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Location:</span>
                      <span>{meeting.location}</span>
                    </div>
                  )}
                  {meeting.meetingLink && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Link:</span>
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Join Meeting
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Organizer:</span>
                    <span>{meeting.organizer.name}</span>
                  </div>
                  {meeting.attendees.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium">Attendees:</span>
                      <div className="flex flex-wrap gap-2">
                        {meeting.attendees.map((attendee) => (
                          <span key={attendee._id} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {attendee.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDelete(meeting._id)}
                className="ml-4 text-red-600 hover:text-red-800 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MeetingList;
