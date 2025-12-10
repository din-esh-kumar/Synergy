import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './doc/swagger';

dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`), false);
    }
  },
  credentials: true,
}));

// Routes - Synergy
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import userRoutes from './routes/user.routes';
import meetingsRoutes from './routes/meetings.routes';
import taskRoutes from './routes/task.routes';
import teamRoutes from './routes/teams.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationsRoutes from './routes/notifications.routes';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);

// Routes - Leave/HR
import timesheetRoutes from './routes/timesheet.routes';
import expenseRoutes from './routes/expense.routes';
import leaveRoutes from './routes/leave.routes';
import exportRoutes from './routes/export.routes';

app.use('/api/timesheets', timesheetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/export', exportRoutes);

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;
