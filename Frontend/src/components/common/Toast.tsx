import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastId = 0;
let toastCallbacks: ((toast: Toast) => void)[] = [];

export const showToast = {
  success: (message: string, duration = 3000) => {
    const id = `toast-${++toastId}`;
    toastCallbacks.forEach((cb) => cb({ id, message, type: 'success', duration }));
  },
  error: (message: string, duration = 4000) => {
    const id = `toast-${++toastId}`;
    toastCallbacks.forEach((cb) => cb({ id, message, type: 'error', duration }));
  },
  warning: (message: string, duration = 3000) => {
    const id = `toast-${++toastId}`;
    toastCallbacks.forEach((cb) => cb({ id, message, type: 'warning', duration }));
  },
  info: (message: string, duration = 3000) => {
    const id = `toast-${++toastId}`;
    toastCallbacks.forEach((cb) => cb({ id, message, type: 'info', duration }));
  },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      case 'info':
        return <Info size={20} />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${getBgColor()} ${getTextColor()} animate-slide-down`}
    >
      {getIcon()}
      <p className="font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-auto hover:opacity-70 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    toastCallbacks.push(handleNewToast);
    return () => {
      toastCallbacks = toastCallbacks.filter((cb) => cb !== handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-[9999] max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export const initializeToast = () => <ToastContainer />;

export default ToastContainer;
