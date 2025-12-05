// backend/src/app.ts

import express, {
  Express,
  Application,
  Request,
  Response,
  NextFunction,
} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables (optional if already done in server.ts)
dotenv.config();

// Initialize express app
const app: Application = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);

// Static uploads (adjust path if needed)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/auth.routes';
import meetingsRoutes from './routes/meetings.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import adminUserRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import teamRoutes from './routes/teams.routes';
import issueRoutes from './routes/issue.routes';
import notificationsRoutes from './routes/notifications.routes';
import chatRoutes from './routes/chat.routes';
import documentRoutes from './routes/document.routes';
import settingsRoutes from './routes/settings.routes';

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware – must have 4 params
app.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(status).json({
      success: false,
      message,
    });
  },
);

// 404 handler (placed AFTER routes, BEFORE export)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;
