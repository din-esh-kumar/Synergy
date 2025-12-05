import { useNotifications } from '../../context/NotificationContext';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

export default function NotificationMenu() {
  const { notifications, markAsRead, deleteNotification, markAllAsRead } =
    useNotifications();

  return (
    <div className="w-80 max-h-96 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Notifications
        </h3>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-gray-500 dark:text-gray-400">
            No notifications
          </p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => markAsRead(notif.id)}
              className={`p-3 border-b border-gray-100 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 ${
                notif.read
                  ? 'bg-white dark:bg-slate-800'
                  : 'bg-blue-50 dark:bg-blue-900/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {notif.message}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {format(new Date(notif.createdAt), 'MMM dd, HH:mm')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
