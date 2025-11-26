import { createBrowserRouter } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './dashboard/AdminDashboard';
import ManagerDashboard from './dashboard/ManagerDashboard';
import EmployeeDashboard from './dashboard/EmployeeDashboard';
import MeetingsHome from './meetings/MeetingsHome';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/dashboard', element: <AdminDashboard /> },
          { path: '/dashboard/admin', element: <AdminDashboard /> },
          { path: '/dashboard/manager', element: <ManagerDashboard /> },
          { path: '/dashboard/employee', element: <EmployeeDashboard /> },
          { path: '/meetings', element: <MeetingsHome /> },
          { index: true, element: <AdminDashboard /> },
        ],
      },
    ],
  },
]);
