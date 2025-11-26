import { Toaster, toast } from 'react-hot-toast';

export const initializeToast = () => <Toaster position="top-right" />;

export const showToast = {
  success: (message: string) => toast.success(message, { duration: 3000 }),
  error: (message: string) => toast.error(message, { duration: 4000 }),
  loading: (message: string) => toast.loading(message),
  info: (message: string) =>
    toast(
      <span className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
        {message}
      </span>,
      { duration: 3000 }
    ),
};

export default initializeToast;
