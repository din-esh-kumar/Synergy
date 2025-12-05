// backend/src/config/socket.config.ts
import { Server } from 'socket.io';
import http from 'http';

let io: Server | null = null;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ✅ CRITICAL: Handle client registration
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('register', (userId: string) => {
      if (userId) {
        socket.join(userId);
        console.log(`✅ ${userId} joined room`);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
