// backend/src/server.ts
import http, { Server as HTTPServer } from 'http';
import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/database';
import { initSocket } from './config/socket.config';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Create HTTP server from Express app
    const server: HTTPServer = http.createServer(app);

    // 3. Initialize Socket.io
    initSocket(server);

    // 4. Start Server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
