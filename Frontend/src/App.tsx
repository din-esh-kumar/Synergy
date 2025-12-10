// src/App.tsx
import React from "react";
import { Toaster } from "react-hot-toast";

import { SettingsProvider } from "./context/SettingsContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatProvider } from "./context/ChatContext";
import { TaskProvider } from "./context/TaskContext";
import { TeamProvider } from "./context/TeamContext";

interface AppProps {
  children: React.ReactNode;
}

const App: React.FC<AppProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <NotificationProvider>
        <ChatProvider>
          <TaskProvider>
            <TeamProvider>
              {/* Render children (Layout + routes) */}
              {children}
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#1e293b",
                    color: "#f1f5f9",
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  },
                  success: {
                    style: { background: "#10b981", color: "#ffffff" },
                  },
                  error: {
                    style: { background: "#ef4444", color: "#ffffff" },
                  },
                }}
              />
            </TeamProvider>
          </TaskProvider>
        </ChatProvider>
      </NotificationProvider>
    </SettingsProvider>
  );
};

export default App;
