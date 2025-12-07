// frontend/src/hooks/useRealtimeTasks.ts

import { useContext } from 'react';
import { TaskContext } from '../context/TaskContext';

export function useTasks() {
  const context = useContext(TaskContext);
  
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }

  return context;
}
































// import { useEffect, useContext } from 'react';
// import { getSocket } from '../utils/socket';
// import { TaskContext } from '../contexts/TaskContext';

// export function useRealtimeTasks() {
//   const { tasks, setTasks, addTask, updateTask, removeTask } =
//     useContext(TaskContext);
//   const socket = getSocket();

//   useEffect(() => {
//     if (!socket) return;

//     // Task created
//     socket.on('task:created', (data) => {
//       console.log('✅ New task created:', data);
//       addTask({
//         _id: data.taskId,
//         title: data.title,
//         assignedTo: data.assignedTo,
//         priority: data.priority,
//         dueDate: data.dueDate,
//         status: 'PENDING',
//         createdBy: data.createdBy,
//         createdAt: data.timestamp,
//       });
//     });

//     // Task updated
//     socket.on('task:updated', (data) => {
//       console.log('✏️  Task updated:', data);
//       updateTask(data.taskId, data);
//     });

//     // Task deleted
//     socket.on('task:deleted', ({ taskId }) => {
//       console.log('🗑️  Task deleted:', taskId);
//       removeTask(taskId);
//     });

//     // Comment added
//     socket.on('task:comment_added', (data) => {
//       console.log('💬 Comment added:', data);
//       updateTask(data.taskId, { comments: [data.comment] });
//     });

//     return () => {
//       socket.off('task:created');
//       socket.off('task:updated');
//       socket.off('task:deleted');
//       socket.off('task:comment_added');
//     };
//   }, [socket, addTask, updateTask, removeTask]);

//   return { tasks };
// }
