import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => (
  <div className="flex min-h-screen bg-[#101626]">
    <Sidebar />
    <div className="flex flex-col flex-1">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout;
