import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { initializeToast } from './components/common/Toast';

const App: React.FC = () => {
  React.useEffect(() => {
    initializeToast();
  }, []);

  return (
    <RouterProvider router={router} />
  );
};

export default App;
