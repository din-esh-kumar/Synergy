// src/App.tsx
import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { initializeToast } from "./components/common/Toast";

const App: React.FC = () => {
  initializeToast();

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-slate-950 text-white">
          <RouterProvider router={router} />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
