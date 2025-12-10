// src/components/MeetingList.tsx - Updated with EMS Table UI
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Meeting {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: any[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: any;
}

interface MeetingListProps {
  searchTerm: string;
  statusFilter: string;
}

export default function MeetingList({ searchTerm, statusFilter }: MeetingListProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meetings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (filteredMeetings.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-video text-gray-300 text-5xl mb-4"></i>
        <p className="text-gray-500 text-lg">No meetings found</p>
        <p className="text-gray-400 text-sm mt-1">
          {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first meeting to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Meeting
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Attendees
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredMeetings.map((meeting, index) => (
            <tr key={meeting._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {index + 1}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="font-medium text-gray-900">{meeting.title}</div>
                {meeting.description && (
                  <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                    {meeting.description}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div>{formatDateTime(meeting.startTime)}</div>
                <div className="text-xs text-gray-400">
                  to {formatDateTime(meeting.endTime)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {meeting.location || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <i className="fas fa-users text-gray-400 text-xs"></i>
                  <span>{meeting.attendees?.length || 0}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(meeting.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex gap-2">
                  <Link
                    to={`/meetings/${meeting._id}`}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="View"
                  >
                    <i className="fas fa-eye"></i>
                  </Link>
                  <Link
                    to={`/meetings/${meeting._id}/edit`}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </Link>
                  <button
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
        Showing {filteredMeetings.length} of {meetings.length} meetings
      </div>
    </div>
  );
}




























// import React from 'react';
// import { Meeting } from '../../types/meetings.types';
// import {
//   Edit,
//   Trash2,
//   Calendar,
//   Clock,
//   User,
//   MapPin,
//   Users,
//   Video,
// } from 'lucide-react';

// interface Props {
//   meeting: Meeting;
//   currentUserId?: string;
//   currentUserRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
//   onEdit: () => void;
//   onDelete: () => void;
//   onJoin: () => void;
// }

// const statusStyles: Record<string, { badge: string; label: string }> = {
//   scheduled: {
//     badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
//     label: 'Scheduled',
//   },
//   upcoming: {
//     badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
//     label: 'Upcoming',
//   },
//   ongoing: {
//     badge:
//       'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
//     label: 'Ongoing',
//   },
//   completed: {
//     badge:
//       'bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300',
//     label: 'Completed',
//   },
// };

// const MeetingList: React.FC<Props> = ({
//   meeting,
//   currentUserId,
//   currentUserRole,
//   onEdit,
//   onDelete,
//   onJoin,
// }) => {
//   const statusKey = (meeting.status || 'scheduled').toLowerCase();
//   const status = statusStyles[statusKey] || statusStyles.scheduled;

//   const isOrganizer =
//     typeof meeting.organizer === 'string'
//       ? meeting.organizer === currentUserId
//       : (meeting.organizer as any)?._id === currentUserId;

//   const invitedCount = Array.isArray(meeting.invitedUsers)
//     ? meeting.invitedUsers.length
//     : 0;

//   const start = meeting.startTime ? new Date(meeting.startTime) : null;
//   const end = meeting.endTime ? new Date(meeting.endTime) : null;
//   const now = new Date();

//   const canJoin =
//     !!meeting.joinLink &&
//     !!start &&
//     (!!end ? start <= now && now <= end : start <= now);

//   const canManage =
//   currentUserRole === 'ADMIN' || isOrganizer;


//   return (
//     <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-all">
//       {/* Header row: title + status badge + organizer badge */}
//       <div className="flex items-start justify-between mb-2">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//             {meeting.title}
//           </h3>
//           {meeting.description && (
//             <p className="text-gray-600 dark:text-gray-400 text-sm">
//               {meeting.description}
//             </p>
//           )}
//         </div>
//         <div className="flex items-center gap-2 ml-4">
//           <span
//             className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.badge}`}
//           >
//             {status.label}
//           </span>
//           {isOrganizer && (
//             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
//               Organizer
//             </span>
//           )}
//         </div>
//       </div>

//       {/* Meta information row */}
//       <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
//         {start && (
//           <div className="flex items-center gap-1.5">
//             <Calendar className="w-4 h-4" />
//             <span>{start.toLocaleDateString()}</span>
//           </div>
//         )}

//         {start && (
//           <div className="flex items-center gap-1.5">
//             <Clock className="w-4 h-4" />
//             <span>
//               {start.toLocaleTimeString([], {
//                 hour: '2-digit',
//                 minute: '2-digit',
//               })}
//               {end && (
//                 <>
//                   {' - '}
//                   {end.toLocaleTimeString([], {
//                     hour: '2-digit',
//                     minute: '2-digit',
//                   })}
//                 </>
//               )}
//             </span>
//           </div>
//         )}

//         {meeting.location && (
//           <div className="flex items-center gap-1.5">
//             <MapPin className="w-4 h-4" />
//             <span>{meeting.location}</span>
//           </div>
//         )}

//         {meeting.organiserName && (
//           <div className="flex items-center gap-1.5">
//             <User className="w-4 h-4" />
//             <span>{meeting.organiserName}</span>
//           </div>
//         )}

//         {invitedCount > 0 && (
//           <div className="flex items-center gap-1.5">
//             <Users className="w-4 h-4" />
//             <span>{invitedCount} invited</span>
//           </div>
//         )}
//       </div>

//       {/* Action buttons row */}
//       <div className="flex items-center gap-2">
//         {/* Join button */}
//         {meeting.joinLink && (
//           <button
//             onClick={onJoin}
//             className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
//               canJoin
//                 ? 'bg-green-600 hover:bg-green-700 text-white'
//                 : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
//             }`}
//           >
//             <Video className="w-4 h-4" />
//             {canJoin ? 'Join' : 'Not started'}
//           </button>
//         )}

//         {/* Edit & Delete icons (compact) */}
//         {canManage && (
//           <div className="flex items-center gap-1.5 ml-auto">
//             <button
//               onClick={onEdit}
//               className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all"
//               title="Edit meeting"
//             >
//               <Edit className="w-4 h-4" />
//             </button>
//             <button
//               onClick={onDelete}
//               className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all"
//               title="Delete meeting"
//             >
//               <Trash2 className="w-4 h-4" />
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MeetingList;
