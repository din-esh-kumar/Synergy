import React from 'react';
import { Task } from '../../types/dashboard.types';

interface Props {
  tasks: Task[];
}

const RecentTasks: React.FC<Props> = ({ tasks }) => (
  <div>
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Tasks</h2>
    {tasks.length === 0 ? (
      <div>No recent tasks.</div>
    ) : (
      <ul>
        {tasks.map(task => (
          <li key={task._id} className="mb-2">
            <span className="font-bold">{task.title}</span>
            {' — '}
            {task.status}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default RecentTasks;
