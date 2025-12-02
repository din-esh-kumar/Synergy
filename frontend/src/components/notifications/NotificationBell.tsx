// src/components/NotificationBell.tsx
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

  const unreadLabel = unreadCount > 9 ? '9+' : unreadCount.toString();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell size={20} className="text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 max-h-96 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div>
              <p className="font-semibold text-sm">Notifications</p>
              <p className="text-xs text-gray-400">
                {unreadCount} unread
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="w-full flex items-center justify-center gap-2 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  <CheckCircle size={14} />
                  Mark all as read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-gray-400 text-sm">
                <Bell size={28} className="mx-auto mb-2 opacity-40" />
                No notifications
              </div>
            ) : (
              <ul className="divide-y divide-slate-700/70">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 text-sm ${
                      n.read ? 'bg-slate-800' : 'bg-slate-700/60'
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{n.title}</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className="p-1 hover:bg-blue-600/20 rounded"
                            title="Mark as read"
                          >
                            <Check size={14} className="text-blue-400" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(n.id)}
                          className="p-1 hover:bg-red-600/20 rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
