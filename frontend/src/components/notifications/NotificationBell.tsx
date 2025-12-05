import React, { useState } from 'react';
import { Bell, X, Check, CheckCircle, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [open, setOpen] = useState(false);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // ✅ markAsRead takes 1 argument (notificationId only)
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      // ✅ deleteNotification takes 1 argument (notificationId only)
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // ✅ markAllAsRead takes 0 arguments
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const unreadLabel = unreadCount > 9 ? '9+' : unreadCount.toString();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team':
        return '👥';
      case 'project':
        return '📁';
      case 'task':
        return '✓';
      case 'meeting':
        return '📅';
      case 'chat':
        return '💬';
      default:
        return '📢';
    }
  };

  const formatTime = (dateInput: string | Date) => {
    // ✅ Handle both string and Date types
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-slate-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
            {unreadLabel}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-96 max-h-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-0">
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                Notifications
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {unreadCount} unread
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md transition-colors whitespace-nowrap"
                >
                  <CheckCircle size={14} />
                  Read all
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                aria-label="Close notifications"
              >
                <X size={16} className="text-slate-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-slate-500 dark:text-gray-400 text-sm">
                <Bell size={28} className="mx-auto mb-2 opacity-40" />
                No notifications
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700/70">
                {notifications.map((notification) => {
                  // ✅ CRITICAL: Extract ID once, use the fallback pattern
                  const notifId = notification.id || notification._id || '';
                  
                  // ✅ Skip if no valid ID
                  if (!notifId) return null;

                  return (
                    <li
                      key={notifId}
                      className={`px-4 py-3 text-sm transition-colors ${
                        notification.read
                          ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          : 'bg-blue-50 dark:bg-slate-700/60 hover:bg-blue-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex justify-between gap-3">
                        {/* Icon and Content */}
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className="text-lg flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900 dark:text-white truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-2">
                              {/* ✅ Pass potentially Date or string */}
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-center gap-1 ml-2 flex-shrink-0">
                          {!notification.read && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notifId)}
                              className="p-1.5 hover:bg-blue-200 dark:hover:bg-blue-600/30 rounded transition-colors"
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <Check
                                size={16}
                                className="text-blue-600 dark:text-blue-400"
                              />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(notifId)}
                            className="p-1.5 hover:bg-red-200 dark:hover:bg-red-600/30 rounded transition-colors"
                            title="Delete notification"
                            aria-label="Delete"
                          >
                            <Trash2
                              size={16}
                              className="text-red-600 dark:text-red-400"
                            />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 text-center bg-slate-50 dark:bg-slate-800/50">
              <a
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;