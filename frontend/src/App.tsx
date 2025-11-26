import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
