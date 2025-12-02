// src/App.tsx
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { initializeToast } from './components/common/Toast';

const App: React.FC = () => {
  initializeToast();

  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-slate-950 text-white">
            <RouterProvider router={router} />
          </div>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
