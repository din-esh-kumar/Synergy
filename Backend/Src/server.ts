// src/server.ts - COMPLETE FIXED VERSION
import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import connectDB from './config/database';  // Returns Connection
import { initSocket } from './config/socket.config';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // ✅ FIXED - Call the connect function from database config
    await connectDB();  // ← This is the function call
    
    const server = http.createServer(app);
    initSocket(server);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
