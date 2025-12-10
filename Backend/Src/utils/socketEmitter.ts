import { Server } from 'socket.io';

let ioInstance: Server;

/**
 * ✅ Initialize the Socket.io instance
 */
export const setIOInstance = (io: Server) => {
  ioInstance = io;
  console.log('✅ Socket.io instance initialized');
};

/**
 * ✅ Get the current Socket.io instance
 */
export const getIOInstance = (): Server | undefined => {
  return ioInstance;
};

// ============================================
// ✅ CORE NOTIFICATION EMITTER (REPLACES emitNotificationToUser)
// ============================================

export const emitNotificationToUser = (userId: string, payload: any) => {
  try {
    if (!ioInstance) {
      console.warn('⚠️ Socket.io not initialized');
      return;
    }
    ioInstance.to(userId).emit('notification', payload);
    console.log(`📢 Notification emitted to user ${userId}`);
  } catch (error) {
    console.error('❌ Error emitting notification to user:', error);
  }
};

// ✅ Alias (Keeps backward compatibility)
export const emitNotification = (userId: string, notification: any) => {
  emitNotificationToUser(userId, notification);
};

export const emitUserNotification = (userId: string, notification: any) => {
  emitNotificationToUser(userId, notification);
};

// ============================================
// 💬 CHAT EMITTERS
// ============================================

export const emitChatMessage = (conversationId: string, message: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`chat-${conversationId}`).emit('chat-message', message);
  } catch (error) {
    console.error('❌ Error emitting chat message:', error);
  }
};

export const emitChatListUpdate = (userId: string, chatData: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`user-${userId}`).emit('chat-list-update', chatData);
  } catch (error) {
    console.error('❌ Error emitting chat list update:', error);
  }
};

export const emitChatTyping = (
  conversationId: string,
  userId: string,
  isTyping: boolean,
) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`chat-${conversationId}`).emit('user-typing', {
      userId,
      isTyping,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('❌ Error emitting typing indicator:', error);
  }
};

// ============================================
// 👥 TEAM EMITTERS
// ============================================

export const emitTeamMessage = (teamId: string, message: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`team-${teamId}`).emit('team-message', message);
  } catch (error) {
    console.error('❌ Error emitting team message:', error);
  }
};

export const emitTeamNotification = (teamId: string, notification: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`team-${teamId}`).emit('team-notification', notification);
  } catch (error) {
    console.error('❌ Error emitting team notification:', error);
  }
};

// ============================================
// 📊 PROJECT EMITTERS
// ============================================

export const emitProjectMessage = (projectId: string, message: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`project-${projectId}`).emit('project-message', message);
  } catch (error) {
    console.error('❌ Error emitting project message:', error);
  }
};

export const emitProjectNotification = (projectId: string, notification: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`project-${projectId}`).emit('project-notification', notification);
  } catch (error) {
    console.error('❌ Error emitting project notification:', error);
  }
};

// ============================================
// ✅ TASK EMITTERS
// ============================================

export const emitTaskMessage = (taskId: string, message: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`task-${taskId}`).emit('task-message', message);
  } catch (error) {
    console.error('❌ Error emitting task message:', error);
  }
};

export const emitTaskNotification = (taskId: string, notification: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`task-${taskId}`).emit('task-notification', notification);
  } catch (error) {
    console.error('❌ Error emitting task notification:', error);
  }
};

// ============================================
// 🟢 STATUS & GENERIC ROOM EMITTERS
// ============================================

export const emitOnlineStatus = (userId: string, isOnline: boolean) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.emit('user-online-status', { userId, isOnline });
  } catch (error) {
    console.error('❌ Error emitting online status:', error);
  }
};

export const emitToRoom = (roomId: string, event: string, data: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(roomId).emit(event, data);
  } catch (error) {
    console.error('❌ Error emitting to room:', error);
  }
};

export const emitBroadcast = (event: string, data: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.emit(event, data);
  } catch (error) {
    console.error('❌ Error broadcasting:', error);
  }
};

export const emitToSocket = (socketId: string, event: string, data: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(socketId).emit(event, data);
  } catch (error) {
    console.error('❌ Error emitting to socket:', error);
  }
};

export const emitToRole = (role: string, event: string, data: any) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.to(`role-${role}`).emit(event, data);
  } catch (error) {
    console.error('❌ Error emitting to role:', error);
  }
};

export const emitToMultipleUsers = (
  userIds: string[],
  event: string,
  data: any,
) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    userIds.forEach(userId => {
      ioInstance.to(`user-${userId}`).emit(event, data);
    });
  } catch (error) {
    console.error('❌ Error emitting to multiple users:', error);
  }
};

export const emitToAllExcept = (
  excludeUserId: string,
  event: string,
  data: any,
) => {
  try {
    if (!ioInstance) return console.warn('⚠️ Socket.io not initialized');
    ioInstance.except(`user-${excludeUserId}`).emit(event, data);
  } catch (error) {
    console.error('❌ Error emitting to all except user:', error);
  }
};

export const getConnectedSockets = () => {
  try {
    if (!ioInstance) return [];
    return Array.from(ioInstance.sockets.sockets.values());
  } catch (error) {
    console.error('❌ Error getting connected sockets:', error);
    return [];
  }
};

// ✅ DEFAULT EXPORT
export default {
  setIOInstance,
  getIOInstance,
  emitNotificationToUser,
  emitNotification,
  emitUserNotification,
  emitChatMessage,
  emitChatListUpdate,
  emitChatTyping,
  emitTeamMessage,
  emitTeamNotification,
  emitProjectMessage,
  emitProjectNotification,
  emitTaskMessage,
  emitTaskNotification,
  emitOnlineStatus,
  emitToRoom,
  emitBroadcast,
  emitToSocket,
  emitToRole,
  emitToMultipleUsers,
  emitToAllExcept,
  getConnectedSockets,
};
