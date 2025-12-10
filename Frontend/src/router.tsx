// src/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboards/Dashboard";
import MeetingsHome from "./pages/meetings/MeetingsHome";
import MeetingDetails from "./pages/meetings/MeetingDetails";
import TasksHome from "./pages/tasks/TasksHome";
import ProjectsHome from "./pages/projects/ProjectsHome";
import AdminUsers from "./pages/admin/AdminUsers";
import TeamsHome from "./pages/team/TeamsHome";
import IssueHome from "./pages/Issues/IssueHome";
import SettingsPage from "./pages/Settings/SettingsHome";
import MessagesPage from "./pages/chat/MessagesPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import TimesheetList from "./pages/timesheet/TimesheetList";
import ExpenseList from "./pages/expense/ExpenseList";
import LeaveList from "./pages/leave/LeaveList";
import Approvals from "./pages/dashboards/Approvals";
import AdminPanel from "./pages/dashboards/AdminPanel"; // Add this if you have admin panel

export const router = createBrowserRouter([
  // Public Routes
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },

  // Protected Routes - Wrapped with App providers
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App>
          <Layout />
        </App>
      </ProtectedRoute>
    ),
    children: [
      // Dashboard (default route)
      { 
        index: true, 
        element: <Dashboard /> 
      },
      
      // ==================== EMS ROUTES ====================
      { path: "timesheets", element: <TimesheetList /> },
      { path: "expenses", element: <ExpenseList /> },
      { path: "leaves", element: <LeaveList /> },
      { 
        path: "approvals", 
        element: (
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <Approvals />
          </ProtectedRoute>
        )
      },
      { 
        path: "admin", 
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        )
      },

      // ==================== SYNERGY ROUTES ====================
      { path: "meetings", element: <MeetingsHome /> },
      { path: "meetings/:id", element: <MeetingDetails /> },
      { path: "tasks", element: <TasksHome /> },
      { path: "projects", element: <ProjectsHome /> },
      { path: "teams", element: <TeamsHome /> },
      { path: "issues", element: <IssueHome /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "settings", element: <SettingsPage /> },

      // Admin Routes (if needed separately)
      { 
        path: "admin/users", 
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        )
      },

      // Legacy redirect (remove if not needed)
      { path: "dashboard", element: <Navigate to="/" replace /> },
    ],
  },

  // Fallback - Redirect to home instead of /dashboard
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
