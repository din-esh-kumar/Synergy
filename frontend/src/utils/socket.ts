import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize Socket.io connection
 * @param serverUrl - Backend server URL
 * @returns Socket instance
 */
export const initializeSocket = (serverUrl: string = 'http://localhost:5000'): Socket => {
  if (socket) {
    return socket;
  }

  socket = io(serverUrl, {
    auth: {
      token: localStorage.getItem('token'),
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket.io connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket.io disconnected');
  });

  socket.on('error', (error) => {
    console.error('❌ Socket.io error:', error);
  });

  return socket;
};

/**
 * Get the current Socket.io instance
 * @returns Socket instance or null
 */
export const getIOInstance = (): Socket | null => {
  if (!socket) {
    console.warn('⚠️  Socket.io not initialized. Call initializeSocket() first.');
    return null;
  }
  return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔴 Socket.io disconnected');
  }
};

/**
 * Reconnect the socket
 */
export const reconnectSocket = (serverUrl: string = 'http://localhost:5000') => {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
  return initializeSocket(serverUrl);
};

/**
 * Listen to a specific event
 * @param event - Event name
 * @param handler - Event handler function
 */
export const onSocketEvent = (event: string, handler: (...args: any[]) => void) => {
  if (!socket) {
    console.warn('⚠️  Socket.io not initialized');
    return;
  }
  socket.on(event, handler);
};

/**
 * Remove event listener
 * @param event - Event name
 * @param handler - Event handler function
 */
export const offSocketEvent = (event: string, handler?: (...args: any[]) => void) => {
  if (!socket) {
    console.warn('⚠️  Socket.io not initialized');
    return;
  }
  if (handler) {
    socket.off(event, handler);
  } else {
    socket.off(event);
  }
};

/**
 * Emit an event to the server
 * @param event - Event name
 * @param data - Data to emit
 */
export const emitSocketEvent = (event: string, data?: any) => {
  if (!socket) {
    console.warn('⚠️  Socket.io not initialized');
    return;
  }
  socket.emit(event, data);
};

export default {
  initializeSocket,
  getIOInstance,
  disconnectSocket,
  reconnectSocket,
  onSocketEvent,
  offSocketEvent,
  emitSocketEvent,
};
