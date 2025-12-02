import React from 'react';
import { DashboardWidget } from '../../types/dashboard.types';

interface QuickStatsProps {
  widgets: DashboardWidget[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ widgets }) => {
  const getColorClass = (color: string) => {
    const map: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
    };
    return map[color] || map.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {widgets.map((w, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {w.title}
          </p>
          <p className="text-3xl font-bold mb-2">{w.value}</p>
          {w.trend !== undefined && (
            <p className="text-xs text-green-600 dark:text-green-400">
              +{w.trend}% this month
            </p>
          )}
          <div className="mt-3 h-1.5 w-16 rounded-full" style={{}} />
          <div className={`mt-3 h-1.5 w-16 rounded-full ${getColorClass(w.color)}`} />
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
