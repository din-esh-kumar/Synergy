// src/components/EMS/ConfirmationModal.tsx - REUSABLE MODAL
import React from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  actionType: 'approve' | 'reject';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  actionType
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {actionType === 'approve' ? (
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            ) : (
              <XCircleIcon className="w-6 h-6 text-red-500" />
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all shadow-lg ${
                actionType === 'approve'
                  ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 focus:ring-green-500'
                  : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 focus:ring-red-500'
              }`}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
