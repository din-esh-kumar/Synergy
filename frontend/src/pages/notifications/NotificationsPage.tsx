// src/pages/notifications/NotificationsPage.tsx
import React, { useEffect } from 'react';
import { Bell, CheckCircle, X, Clock, Mail } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import Loader from '../../components/Notifications/NotificationMenu';

const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    unread, 
    loading, 
    loadNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  if (loading) return <Loader />;

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {unread} unread • {notifications.length} total
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <CheckCircle size={18} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <Bell className="text-blue-500" size={24} />
              Unread ({unreadNotifications.length})
            </h2>
            <div className="space-y-3">
              {unreadNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all relative"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mt-1">
                      <Bell size={20} className="text-blue-500" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <CheckCircle size={18} className="text-green-500" />
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <X size={18} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Read Notifications */}
        {readNotifications.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
              <Mail className="text-gray-400" size={24} />
              Previously read ({readNotifications.length})
            </h2>
            <div className="space-y-2">
              {readNotifications.slice(-10).map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate pr-8">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {notification.message}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-24">
            <Bell className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              You'll see updates here when there are new messages, meeting reminders, 
              or task assignments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
