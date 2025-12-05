import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/database';
import { initializeSocket } from './socket';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    // 1) Connect to MongoDB
    await connectDB();

    // 2) Create HTTP server from Express app
    const server = http.createServer(app);

    // 3) Initialize Socket.io on that server
    initializeSocket(server);

    // 4) Start listening
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
