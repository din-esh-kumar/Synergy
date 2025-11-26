import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import dailyUpdateRoutes from './routes/daliyupdate.routes';
import weeklyReportRoutes from './routes/weeklyupdate.routes'; // Import the new route

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());   // Enable CORS for frontend communication
app.use(helmet()); // Security headers

// Database Connection
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/daily-updates', dailyUpdateRoutes);
app.use('/api/weekly-reports', weeklyReportRoutes); // Register the new route

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Something went wrong!', error: err.message });
});

export default app;