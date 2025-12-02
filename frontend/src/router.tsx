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
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE']}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/meetings',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE']}>
            <MeetingsHome />
          </ProtectedRoute>
        ),
      },
      {
        path: '/meetings/:id',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE']}>
            <MeetingDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: '/tasks',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE']}>
            <TasksHome />
          </ProtectedRoute>
        ),
      },
      {
        path: '/projects',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <ProjectsHome />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminUsers />
          </ProtectedRoute>
        ),
      },
      // NEW: Teams
      {
  path: '/teams',
  element: (
    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
      <TeamsHome />
    </ProtectedRoute>
  ),
},
      // NEW: Issues
      {
        path: '/issues',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE']}>
            <IssueList />
          </ProtectedRoute>
        ),
      },
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
