import React from 'react';

interface LoaderProps {
  fullScreen?: boolean;
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ fullScreen = false, text }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-200">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      {text && <p className="text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 z-[999]">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
