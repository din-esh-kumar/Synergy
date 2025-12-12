// src/components/EMS/ReceiptModal.tsx - RECEIPT VIEWER
import React from 'react';
import { XMarkIcon } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string;
  expense: any;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptUrl, expense }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ReceiptIcon className="w-6 h-6 text-gray-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Receipt - ₹{expense.amount?.toLocaleString()}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {expense.merchantName || 'N/A'} • {new Date(expense.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Receipt Image/PDF */}
        <div className="flex-1 p-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden max-h-[70vh]">
            {receiptUrl?.startsWith('http') ? (
              <img 
                src={receiptUrl} 
                alt="Receipt"
                className="w-full h-full object-contain max-h-[70vh]"
              />
            ) : (
              <iframe
                src={receiptUrl}
                className="w-full h-full min-h-[500px]"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Category:</span>
              <span className="font-medium capitalize">{expense.category}</span>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                Download
              </button>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
