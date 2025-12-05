// src/pages/Notifications/NotificationsPage.tsx

import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
  Mail,
  Users,
  Briefcase,
  CheckSquare,
  MessageSquare,
  Calendar,
  AlertCircle,
  Trash2,
  Search,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

type FilterType = 'all' | 'unread' | 'mentions' | 'tasks' | 'meetings' | 'messages';

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,        // from NotificationContextType
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team':
        return <Users className="w-5 h-5" />;
      case 'project':
        return <Briefcase className="w-5 h-5" />;
      case 'task':
      case 'subtask':
        return <CheckSquare className="w-5 h-5" />;
      case 'meeting':
        return <Calendar className="w-5 h-5" />;
      case 'chat':
      case 'message':
        return <MessageSquare className="w-5 h-5" />;
      case 'system':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'team':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
      case 'project':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100';
      case 'task':
      case 'subtask':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100';
      case 'meeting':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100';
      case 'chat':
      case 'message':
        return 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-100';
      case 'system':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'team':
        return 'text-blue-600 dark:text-blue-400';
      case 'project':
        return 'text-purple-600 dark:text-purple-400';
      case 'task':
      case 'subtask':
        return 'text-green-600 dark:text-green-400';
      case 'meeting':
        return 'text-orange-600 dark:text-orange-400';
      case 'chat':
      case 'message':
        return 'text-pink-600 dark:text-pink-400';
      case 'system':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const formatTime = (date: string | Date) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diff = now.getTime() - notificationDate.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return notificationDate.toLocaleDateString();
  };

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    switch (filter) {
      case 'unread':
        result = result.filter((n) => !n.read);
        break;
      case 'mentions':
        result = result.filter((n) =>
          n.message?.toLowerCase().includes('@')
        );
        break;
      case 'tasks':
        result = result.filter((n) =>
          ['task', 'subtask'].includes(n.type)
        );
        break;
      case 'meetings':
        result = result.filter((n) => n.type === 'meeting');
        break;
      case 'messages':
        result = result.filter((n) =>
          ['chat', 'message'].includes(n.type)
        );
        break;
      default:
        break;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(term) ||
          n.message?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [notifications, filter, searchTerm]);

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                Notifications
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Review and manage all your recent alerts and updates.
              </p>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">
                {unreadCount}
              </span>{' '}
              unread •{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {notifications.length}
              </span>{' '}
              total
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-24 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-0 pt-0 scrollbar-hide">
            {([
              { key: 'all', label: 'All', icon: Bell },
              { key: 'unread', label: 'Unread', icon: Mail },
              { key: 'mentions', label: 'Mentions', icon: AlertCircle },
              { key: 'tasks', label: 'Tasks', icon: CheckSquare },
              { key: 'meetings', label: 'Meetings', icon: Calendar },
              { key: 'messages', label: 'Messages', icon: MessageSquare },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`whitespace-nowrap px-4 py-4 font-medium transition-all flex items-center gap-2 border-b-2 ${
                    filter === tab.key
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin mb-4">
                <Bell className="w-12 h-12 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Loading notifications...
              </p>
            </div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id || (notification as any)._id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${getNotificationColor(
                  notification.type
                )} ${
                  !notification.read
                    ? 'ring-1 ring-blue-400 dark:ring-blue-600 bg-white dark:bg-slate-800'
                    : 'bg-slate-50 dark:bg-slate-800/50'
                }`}
                onClick={() =>
                  handleNotificationClick(
                    notification.id || (notification as any)._id || '',
                    notification.read || false
                  )
                }
              >
                {/* Icon Container */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    !notification.read
                      ? `${getIconColor(notification.type)} bg-white dark:bg-slate-700`
                      : `${getIconColor(notification.type)} opacity-60`
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3
                        className={`font-semibold truncate ${
                          !notification.read
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p
                        className={`text-sm mt-1 line-clamp-2 ${
                          !notification.read
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(
                              notification.id || (notification as any)._id || ''
                            );
                          }}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(
                            notification.id || (notification as any)._id || ''
                          );
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {!notification.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-lg" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm">
              {searchTerm
                ? 'No notifications match your search. Try adjusting your filters.'
                : "You're all caught up! You'll see updates here when there are new messages, meeting reminders, or task assignments."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
