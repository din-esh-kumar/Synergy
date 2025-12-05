import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { SettingsProvider } from "../context/SettingsContext";
import { NotificationProvider } from "../context/NotificationContext";
import { ChatProvider } from "../context/ChatContext";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SettingsProvider>
      <ChatProvider>
        <NotificationProvider>
          <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
              <main className="flex-1 overflow-y-auto">
                <Outlet />
              </main>
            </div>
          </div>
        </NotificationProvider>
      </ChatProvider>
    </SettingsProvider>
  );
};

export default Layout;
