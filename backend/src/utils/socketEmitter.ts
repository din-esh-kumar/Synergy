import { io } from '../socket';

export function emitNotification(userId: string, notification: any) {
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification);
  }
}

export function emitChatMessage(roomId: string, message: any) {
  if (io) {
    io.to(roomId).emit('message', message);
  }
}

export function emitUserOnline(userId: string) {
  if (io) {
    io.emit('user-online', { userId, timestamp: new Date() });
  }
}

export function emitUserOffline(userId: string) {
  if (io) {
    io.emit('user-offline', { userId, timestamp: new Date() });
  }
}

export function emitTyping(roomId: string, userId: string) {
  if (io) {
    io.to(roomId).emit('user-typing', { userId, roomId });
  }
}

export function emitStoppedTyping(roomId: string, userId: string) {
  if (io) {
    io.to(roomId).emit('user-stopped-typing', { userId, roomId });
  }
}
