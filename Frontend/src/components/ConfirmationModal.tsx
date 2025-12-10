interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: 'red' | 'green' | 'blue';
  loading?: boolean;
  showReasonInput?: boolean;
  reason?: string;
  onReasonChange?: (r: string) => void;
  disableConfirm?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmColor = 'blue',
  loading = false,
  showReasonInput = false,
  reason = '',
  onReasonChange,
  disableConfirm = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colorClasses = {
    red: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-200',
    green: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-200',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-200'
  };

  const iconClasses = {
    red: 'fas fa-exclamation-triangle',
    green: 'fas fa-check-circle',
    blue: 'fas fa-info-circle'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${confirmColor === 'red' ? 'bg-red-100' : confirmColor === 'green' ? 'bg-green-100' : 'bg-blue-100'} flex items-center justify-center`}>
              <i className={`${iconClasses[confirmColor]} ${confirmColor === 'red' ? 'text-red-600' : confirmColor === 'green' ? 'text-green-600' : 'text-blue-600'} text-lg`}></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
          
          {showReasonInput && (
            <div className="mt-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => onReasonChange && onReasonChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                rows={3}
                placeholder="Please provide a reason for rejection..."
                required
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || disableConfirm || (showReasonInput && !reason.trim())}
            className={`px-6 py-2.5 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${colorClasses[confirmColor]}`}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin text-sm"></i>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <i className={`${confirmColor === 'red' ? 'fas fa-sign-out-alt' : confirmColor === 'green' ? 'fas fa-check' : 'fas fa-check'} text-sm`}></i>
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}