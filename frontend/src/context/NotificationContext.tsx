// src/context/NotificationContext.tsx
import { createContext, useState, useCallback, useEffect, useContext, ReactNode } from 'react';
import { notificationService } from '../services/notifications.service';
import { useSocket } from '../hooks/useSocket';

interface Notification {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unread: number;
  loading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const { socket, isConnected } = useSocket();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications(20, 0);
      setNotifications(response.data.notifications || []);
      setUnread(response.data.unread || 0);
    } catch (err) {
      console.error('Error loading notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnread(prev => prev + 1);
      });
      return () => {
        if (socket) {
          socket.off('notification');
        }
      };
    }
  }, [socket, isConnected]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => 
        (n.id === id || n._id === id) ? { ...n, read: true } : n
      ));
      setUnread(prev => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Error marking notification as read', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      console.error('Error marking all notifications as read', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnread(prev => prev + 1);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unread,
      loading,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      addNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
