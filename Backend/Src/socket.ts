import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

export let io: Server;

export function initializeSocket(server: HTTPServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const userId = socket.handshake.query.userId as string;
    if (!userId) {
      return next(new Error('User ID required'));
    }
    socket.data.userId = userId;
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Join user-specific room for notifications
    socket.join(`user-${socket.data.userId}`);

    // Handle chat room joins
    socket.on('join-team-chat', (teamId: string) => {
      socket.join(`team-${teamId}`);
      socket.broadcast.to(`team-${teamId}`).emit('user-joined', {
        userId: socket.data.userId,
        teamId,
      });
    });

    socket.on('join-project-chat', (projectId: string) => {
      socket.join(`project-${projectId}`);
    });

    socket.on('join-task-chat', (taskId: string) => {
      socket.join(`task-${taskId}`);
    });

    // Handle chat messages
    socket.on('send-message', async (data) => {
      const { content, roomId, roomType, attachments } = data;
      socket.broadcast.to(roomId).emit('message', {
        content,
        sender: socket.data.userId,
        roomType,
        attachments,
        timestamp: new Date(),
      });
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.broadcast.to(data.roomId).emit('user-typing', {
        userId: socket.data.userId,
        roomId: data.roomId,
      });
    });

    socket.on('stopped-typing', (data) => {
      socket.broadcast.to(data.roomId).emit('user-stopped-typing', {
        userId: socket.data.userId,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId}`);
      socket.broadcast.emit('user-offline', {
        userId: socket.data.userId,
      });
    });
  });

  return io;
}
