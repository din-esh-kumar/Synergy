// backend/src/config/socket.config.ts

import { Server } from 'socket.io';
import http from 'http';
import { setIOInstance } from '../utils/socketEmitter';

let io: Server | null = null;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ✅ Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      return next(new Error('Authentication required'));
    }

    socket.data.userId = userId;
    socket.data.token = token;
    next();
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id, 'User:', socket.data.userId);

    // ✅ User joins personal room
    socket.on('register', (userId: string) => {
      if (userId) {
        socket.join(userId);
        console.log(`✅ ${userId} joined personal room`);
      }
    });

    // ✅ Join team room
    socket.on('team:join', (teamId: string) => {
      const roomId = `team-${teamId}`;
      socket.join(roomId);
      socket.broadcast.to(roomId).emit('team:member_joined', {
        userId: socket.data.userId,
        teamId,
        timestamp: new Date(),
      });
      console.log(`✅ ${socket.data.userId} joined team room: ${roomId}`);
    });

    // ✅ Leave team room
    socket.on('team:leave', (teamId: string) => {
      const roomId = `team-${teamId}`;
      socket.leave(roomId);
      socket.broadcast.to(roomId).emit('team:member_left', {
        userId: socket.data.userId,
        teamId,
        timestamp: new Date(),
      });
      console.log(`✅ ${socket.data.userId} left team room: ${roomId}`);
    });

    // ✅ Join project room
    socket.on('project:join', (projectId: string) => {
      const roomId = `project-${projectId}`;
      socket.join(roomId);
      socket.broadcast.to(roomId).emit('project:member_joined', {
        userId: socket.data.userId,
        projectId,
        timestamp: new Date(),
      });
      console.log(`✅ ${socket.data.userId} joined project room: ${roomId}`);
    });

    // ✅ Leave project room
    socket.on('project:leave', (projectId: string) => {
      const roomId = `project-${projectId}`;
      socket.leave(roomId);
      socket.broadcast.to(roomId).emit('project:member_left', {
        userId: socket.data.userId,
        projectId,
        timestamp: new Date(),
      });
      console.log(`✅ ${socket.data.userId} left project room: ${roomId}`);
    });

    // ✅ Join task room
    socket.on('task:join', (taskId: string) => {
      const roomId = `task-${taskId}`;
      socket.join(roomId);
      console.log(`✅ ${socket.data.userId} joined task room: ${roomId}`);
    });

    // ✅ Leave task room
    socket.on('task:leave', (taskId: string) => {
      const roomId = `task-${taskId}`;
      socket.leave(roomId);
      console.log(`✅ ${socket.data.userId} left task room: ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  // ✅ Make io instance available globally
  setIOInstance(io);
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
