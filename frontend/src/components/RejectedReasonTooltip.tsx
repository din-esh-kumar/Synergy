// src/components/EMS/RejectedReasonTooltip.tsx
import React, { useState } from 'react';
import { InfoIcon, XIcon } from 'lucide-react';

interface RejectedReasonTooltipProps {
  reason: string;
  size?: 'sm' | 'md';
}

const RejectedReasonTooltip: React.FC<RejectedReasonTooltipProps> = ({
  reason,
  size = 'md',
}) => {
  const [open, setOpen] = useState(false);

  if (!reason) {
    return (
      <span className="text-xs text-red-500">
        Rejected
      </span>
    );
  }

  const badgeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : 'px-3 py-1 text-xs';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center ${badgeClasses} rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors`}
      >
        <InfoIcon className="w-3 h-3 mr-1" />
        Reason
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <InfoIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Rejection reason
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {reason}
              </p>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RejectedReasonTooltip;
