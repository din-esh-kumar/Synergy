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
import AdminUsers from './pages/admin/AdminUsers';
import TeamsHome from './pages/team/TeamsHome';
import { IssueList } from './pages/Issues/IssueList';

// NEW IMPORTS
import SettingsPage from './pages/Settings/SettingsHome';
import MessagesPage from './pages/chat/MessagesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE']}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/meetings', element: <MeetingsHome /> },
      { path: '/meetings/:id', element: <MeetingDetails /> },
      { path: '/tasks', element: <TasksHome /> },
      { path: '/projects', element: <ProjectsHome /> },
      { path: '/admin/users', element: <AdminUsers /> },
      { path: '/teams', element: <TeamsHome /> },
      { path: '/issues', element: <IssueList /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/messages', element: <MessagesPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/', element: <Navigate to="/dashboard" replace /> },
    ].map((route) => ({
      ...route,
      element: (
        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE']}>
          {route.element}
        </ProtectedRoute>
      ),
    })),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
