import { createBrowserRouter } from 'react-router-dom';
import DashboardHome from './dashboard/DashboardHome';
import MeetingsHome from './meetings/MeetingsHome';
// ... other imports

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardHome />,
      },
      {
        path: 'meetings',
        element: <MeetingsHome />,
      },
      // ... other routes
    ],
  },
]);
