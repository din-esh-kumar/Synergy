import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance: Socket | null = null;

export function initializeSocket(url?: string): Socket {
  if (socketInstance?.connected) {
    console.log('✅ Socket already connected');
    return socketInstance;
  }

  const token = localStorage.getItem('token');
  const socketUrl = url || SOCKET_URL;

  socketInstance = io(socketUrl, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socketInstance.on('connect', () => {
    console.log('🔌 Socket connected:', socketInstance?.id);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socketInstance.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  return socketInstance;
}

export function getIOInstance(): Socket | null {
  return socketInstance;
}

export function emitSocketEvent(event: string, data?: any): void {
  if (socketInstance?.connected) {
    socketInstance.emit(event, data);
    console.log(`📤 Emitted: ${event}`, data);
  } else {
    console.warn(`⚠️ Socket not connected. Cannot emit: ${event}`);
  }
}

export function onSocketEvent(
  event: string,
  callback: (data: any) => void
): () => void {
  if (socketInstance) {
    socketInstance.on(event, callback);
    return () => socketInstance?.off(event, callback);
  }
  return () => {};
}

export function disconnectSocket(): void {
  if (socketInstance?.connected) {
    socketInstance.disconnect();
    console.log('🔌 Socket disconnected');
  }
}
