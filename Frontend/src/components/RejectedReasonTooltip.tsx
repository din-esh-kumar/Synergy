import { useState, useEffect, useRef, useCallback } from 'react';

interface RejectedReasonTooltipProps {
  reason?: string;
}

export default function RejectedReasonTooltip({ reason }: RejectedReasonTooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 10,
        left: rect.left + rect.width / 2,
      });
    }
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !tooltipRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Update position on scroll and resize
  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [open, updatePosition]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(prev => !prev);
  }, []);

  return (
    <>
      <div
        ref={buttonRef}
        className="reject-tooltip flex items-center text-red-600 text-xs font-semibold cursor-pointer select-none hover:text-red-700 transition-colors"
        onClick={handleToggle}
        role="button"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <i className="fa-solid fa-times-circle mr-1" aria-hidden="true"></i>
        <span className="underline decoration-dotted">Rejected</span>
        <i className="fa-solid fa-circle-info ml-1 text-[10px] opacity-70" aria-hidden="true"></i>
      </div>

      {open && (
        <div
          ref={tooltipRef}
          className="fixed bg-white border border-gray-200 text-gray-800 text-sm rounded-xl shadow-xl px-4 py-3 z-[9999] animate-fade-in max-w-[90vw] sm:max-w-[22rem] break-words whitespace-normal text-left"
          style={{
            top: `${position.top - 10}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
          role="tooltip"
          aria-labelledby="rejection-reason"
        >
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 text-red-500 flex-shrink-0" aria-hidden="true">
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <div className="leading-snug pr-2" id="rejection-reason">
              {reason || 'No reason provided for rejection'}
            </div>
          </div>

          {/* Triangle pointer */}
          <div
            className="absolute left-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-white"
            style={{ bottom: '-6px', transform: 'translateX(-50%)' }}
            aria-hidden="true"
          ></div>
        </div>
      )}
    </>
  );
}