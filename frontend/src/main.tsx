import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import { TaskProvider } from './context/TaskContext';
import { TeamProvider } from './context/TeamContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
          <TaskProvider>
            <TeamProvider>
              <SettingsProvider>
                <ThemeProvider>
                  <App />
                </ThemeProvider>
              </SettingsProvider>
            </TeamProvider>
          </TaskProvider>
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
);
