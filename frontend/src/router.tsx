// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboards/Dashboard';
import MeetingsHome from './pages/meetings/MeetingsHome';
import MeetingDetails from './pages/meetings/MeetingDetails';
import TasksHome from './pages/tasks/TasksHome';
import ProjectsHome from './pages/projects/ProjectsHome';
import TeamsHome from './pages/team/TeamsHome';
import IssueHome from './pages/Issues/IssueHome';
import SettingsPage from './pages/Settings/SettingsHome';
import MessagesPage from './pages/chat/MessagesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import LeaveList from './pages/Leaves/LeaveList';
import Approvals from './pages/dashboards/Approvals';
import ExpenseList from './pages/Expenses/ExpenseList';
import TimesheetList from './pages/Timesheets/TimesheetList';
import AdminPanel from './pages/dashboards/AdminPanel';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },

  // Protected app routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Dashboard
      { path: '/dashboard', element: <Dashboard /> },
      
      // Synergy Project Management
      { path: '/teams', element: <TeamsHome /> },
      { path: '/projects', element: <ProjectsHome /> },
      { path: '/tasks', element: <TasksHome /> },
      { path: '/issues', element: <IssueHome /> },
      { path: '/meetings', element: <MeetingsHome /> },
      { path: '/meetings/:id', element: <MeetingDetails /> },
      { path: '/messages', element: <MessagesPage /> },
      
      // EMS (Employee Management System)
      { path: '/leaves', element: <LeaveList /> },
      { path: '/expenses', element: <ExpenseList /> },
      { path: '/timesheets', element: <TimesheetList /> },
      { path: '/approvals', element: <Approvals /> },
      
      // Admin
      { path: '/admin', element: <AdminPanel /> },
      
      // General
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      
      // Default redirect to dashboard
      { path: '/', element: <Navigate to="/dashboard" replace /> },
    ],
  },

  // Fallback - redirect to login
  { path: '*', element: <Navigate to="/login" replace /> },
]);
