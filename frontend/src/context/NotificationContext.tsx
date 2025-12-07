// src/context/NotificationContext.tsx
import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { getIOInstance, initializeSocket, emitSocketEvent } from '../utils/socket';

export interface Notification {
  _id: string;
  id: string;
  userId: string;
  type:
    | 'team'
    | 'project'
    | 'task'
    | 'subtask'
    | 'meeting'
    | 'chat'
    | 'message'
    | 'system';
  action?:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'assigned'
    | 'commented'
    | 'mentioned'
    | 'completed';
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  icon?: string;
  color?: string;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStats {
  unreadCount: number;
  byType: Record<string, number>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  fetchNotifications: (limit?: number, skip?: number) => Promise<void>;
  getStats: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);


// Vite env vars
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketInitialized, setSocketInitialized] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (limit = 50, skip = 0) => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await fetch(
          `${API_BASE_URL}/notifications?limit=${limit}&skip=${skip}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch notifications: ${response.statusText}`,
          );
        }

        const result = await response.json();

        if (result.success && result.data) {
          setNotifications(result.data.notifications || []);
          setUnreadCount(result.data.unread ?? 0);
        }

        setError(null);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(errorMsg);
        console.error('❌ Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Get stats
  const getStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/notifications/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get stats');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('❌ Error getting stats:', err);
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId
            ? { ...n, read: true, readAt: new Date() }
            : n,
        ),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/notifications/mark-all/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('❌ Error marking all as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch(
          `${API_BASE_URL}/notifications/${notificationId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to delete notification');
        }

        const deleted = notifications.find(n => n._id === notificationId);
        setNotifications(prev =>
          prev.filter(n => n._id !== notificationId),
        );

        if (deleted && !deleted.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error('❌ Error deleting notification:', err);
      }
    },
    [notifications],
  );

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear notifications');
      }

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('❌ Error clearing notifications:', err);
    }
  }, []);

  // Add new notification (from socket)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // ✅ FIXED Socket listener setup with room registration
  useEffect(() => {
    if (!socketInitialized) {
      try {
        initializeSocket(SOCKET_URL);
        console.log('🔌 Socket initialized');
        setSocketInitialized(true);
      } catch (err) {
        console.error('❌ Failed to initialize socket:', err);
      }
    }

    const io = getIOInstance();
    if (io && socketInitialized) {
      console.log('🔌 Setting up notification listener...');
      
      // ✅ CRITICAL: Register user room FIRST
      const userId = localStorage.getItem('userId') || localStorage.getItem('_id');
      if (userId) {
        emitSocketEvent('register', userId);
        console.log('✅ Registered user room:', userId);
      }

      // ✅ Listen for notifications
      const handleNotification = (notification: Notification) => {
        console.log('📬 Received notification:', notification);
        addNotification(notification);
      };
      
      io.on('notification', handleNotification);
      
      return () => {
        io.off('notification', handleNotification);
        console.log('🔌 Notification listener cleaned up');
      };
    }
  }, [socketInitialized, addNotification]);

  // Initial fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
      getStats();
    }
  }, [fetchNotifications, getStats]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    stats,
    loading,
    error,
    fetchNotifications,
    getStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
