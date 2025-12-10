import React, { useEffect } from "react";

interface ReceiptModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, imageUrl, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Expense receipt viewer"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-auto relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Expense Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl p-1 transition-colors"
            aria-label="Close receipt viewer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt="Expense receipt"
              className="max-h-[60vh] object-contain rounded-lg border border-gray-200 shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.alt = 'Receipt image failed to load';
                target.classList.add('bg-gray-100', 'p-8');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;