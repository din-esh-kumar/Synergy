/**
 * Notification Integration Examples
 * Shows how to integrate notifications across the Synergy platform
 * 
 * KEY PRINCIPLE: Frontend uses context hooks only!
 * Backend (notificationEngine) handles all notification creation
 * Frontend only displays and manages notifications
 */

import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

/**
 * Example 1: Mark notification as read
 * Use this in NotificationBell or NotificationItem components
 */
export const markNotificationAsRead = async () => {
  const { markAsRead } = useNotifications();
  const notificationId = 'notification-123';

  try {
    await markAsRead(notificationId);
    console.log('✓ Notification marked as read');
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
};

/**
 * Example 2: Mark all notifications as read
 * Use this in NotificationBell header or settings
 */
export const markAllNotificationsAsRead = async () => {
  const { markAllAsRead } = useNotifications();

  try {
    await markAllAsRead();
    console.log('✓ All notifications marked as read');
  } catch (error) {
    console.error('Failed to mark all as read:', error);
  }
};

/**
 * Example 3: Delete a notification
 * Use in notification item delete button
 */
export const deleteNotification = async () => {
  const { deleteNotification } = useNotifications();
  const notificationId = 'notification-456';

  try {
    await deleteNotification(notificationId);
    console.log('✓ Notification deleted');
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
};

/**
 * Example 4: Handling socket notifications in real-time
 * The NotificationContext already handles this via useSocket
 * Notifications auto-populate via socket events
 */
export const handleSocketNotifications = () => {
  const { notifications, unreadCount } = useNotifications();

  console.log(`Total notifications: ${notifications.length}`);
  console.log(`Unread count: ${unreadCount}`);

  // This data updates automatically via socket listeners
  // in NotificationContext useEffect
};

/**
 * Example 5: Using notifications in a component
 * This is how to integrate notifications into any component
 */
export const useNotificationsInComponent = () => {
  const { notifications, unreadCount, loading } = useNotifications();

  if (loading) return 'Loading notifications...';
  if (!notifications || notifications.length === 0) return 'No notifications';

  return `You have ${unreadCount} unread notifications`;
};

/**
 * Example 6: Meeting notification flow
 * BACKEND creates this - Frontend just displays it
 * 
 * Flow:
 * 1. Backend: meetings.controller creates meeting
 * 2. Backend: Creates notifications for each attendee
 * 3. Backend: Emits via socket to each user
 * 4. Frontend: NotificationContext receives via socket
 * 5. Frontend: NotificationBell displays notification
 */
export const exampleMeetingNotificationFlow = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();

  console.log('Current user:', user?.name);

  // Meeting notifications appear automatically
  const meetingNotifs = notifications.filter((n) => n.type === 'meeting');
  console.log('Meeting notifications:', meetingNotifs);

  // Frontend CANNOT create notifications!
  // Backend does this via notificationEngine.ts
};

/**
 * Example 7: Task notification flow
 * BACKEND creates this - Frontend just displays it
 * 
 * Flow:
 * 1. Backend: tasks.controller assigns task
 * 2. Backend: Creates notification for assignee
 * 3. Backend: Emits via socket
 * 4. Frontend: NotificationContext receives
 * 5. Frontend: NotificationBell shows it
 */
export const exampleTaskNotificationFlow = () => {
  const { notifications } = useNotifications();

  const taskNotifs = notifications.filter((n) =>
    n.type === 'task' || n.type === 'subtask'
  );

  console.log('Task notifications:', taskNotifs);

  // Frontend DISPLAYS task notifications
  // Backend CREATES them via notificationEngine
};

/**
 * Example 8: Chat mention notification flow
 * BACKEND creates this - Frontend just displays it
 * 
 * When someone mentions @user in team chat:
 * 1. Backend: chat.controller processes message
 * 2. Backend: Extracts mentions from content
 * 3. Backend: Creates notifications for mentioned users
 * 4. Backend: Emits via socket
 * 5. Frontend: Shows notification
 */
export const exampleChatMentionFlow = () => {
  const { notifications } = useNotifications();

  const chatNotifs = notifications.filter((n) =>
    n.type === 'chat' || n.type === 'message'
  );

  console.log('Chat notifications:', chatNotifs);

  // Frontend displays mentions
  // Backend creates them
};

/**
 * Example 9: Notification filtering patterns
 * How to filter notifications in your component
 */
export const exampleFilterNotifications = () => {
  const { notifications } = useNotifications();

  const unreadOnly = notifications.filter((n) => !n.read);
  const meetingNotifications = notifications.filter((n) => n.type === 'meeting');
  const taskNotifications = notifications.filter((n) =>
    n.type === 'task' || n.type === 'subtask'
  );
  const chatNotifications = notifications.filter((n) =>
    n.type === 'chat' || n.type === 'message'
  );

  console.log('Unread:', unreadOnly.length);
  console.log('Meetings:', meetingNotifications.length);
  console.log('Tasks:', taskNotifications.length);
  console.log('Chat:', chatNotifications.length);
};

/**
 * Example 10: Real-time notification count display
 * Perfect for bell icon badge
 */
export const exampleNotificationBadge = () => {
  const { unreadCount } = useNotifications();

  // Display badge: "9+" if more than 9, otherwise exact count
  const badgeLabel = unreadCount > 9 ? '9+' : unreadCount.toString();

  console.log('Badge label:', badgeLabel);
};

/**
 * IMPORTANT: Frontend vs Backend Responsibilities
 *
 * FRONTEND (What you do in React components):
 * ✅ Display notifications
 * ✅ Mark as read
 * ✅ Delete notifications
 * ✅ Filter notifications
 * ✅ Show badge count
 * ✅ Handle user interactions
 *
 * BACKEND (What notificationEngine does):
 * ✅ Create notifications
 * ✅ Save to database
 * ✅ Emit via socket
 * ✅ Handle business logic
 * ✅ Notify multiple users
 *
 * NEVER do in frontend:
 * ❌ Create notifications directly
 * ❌ Import notificationEngine
 * ❌ Modify database
 * ❌ Handle business logic
 */

/**
 * DATA FLOW ARCHITECTURE
 *
 * User Action (Backend):
 *   ↓
 * Backend Logic (e.g., create meeting)
 *   ↓
 * notificationEngine.createNotification()
 *   ↓
 * Save to MongoDB
 *   ↓
 * Emit via WebSocket to user
 *   ↓
 * Frontend Socket Listener (NotificationContext)
 *   ↓
 * Update React State
 *   ↓
 * Component Re-render
 *   ↓
 * User sees notification in NotificationBell
 *   ↓
 * User clicks "Mark as read"
 *   ↓
 * Frontend calls markAsRead(notificationId)
 *   ↓
 * API call to backend
 *   ↓
 * Backend updates database
 *   ↓
 * Backend emits update via socket
 *   ↓
 * Frontend updates state
 *   ↓
 * UI updates
 */

export default {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  handleSocketNotifications,
  useNotificationsInComponent,
  exampleMeetingNotificationFlow,
  exampleTaskNotificationFlow,
  exampleChatMentionFlow,
  exampleFilterNotifications,
  exampleNotificationBadge,
};