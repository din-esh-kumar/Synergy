import{
  createContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';

export interface Task {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo: any;
  projectId?: string;
  createdBy: any;
  createdAt: string;
  dueDate?: string;
  comments?: any[];
}

export interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) =>
        (t._id === taskId || t.id === taskId)
          ? { ...t, ...updates }
          : t
      )
    );
  }, []);

  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.filter((t) => t._id !== taskId && t.id !== taskId)
    );
  }, []);

  // Listen for real-time task updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTaskCreated = (task: Task) => {
      console.log('📝 Task created:', task);
      addTask(task);
    };

    const handleTaskUpdated = (data: { taskId: string; updates: Partial<Task> }) => {
      console.log('✏️ Task updated:', data);
      updateTask(data.taskId, data.updates);
    };

    const handleTaskDeleted = (data: { taskId: string }) => {
      console.log('🗑️ Task deleted:', data);
      removeTask(data.taskId);
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [socket, isConnected, addTask, updateTask, removeTask]);

  const value: TaskContextType = {
    tasks,
    loading,
    error,
    setTasks,
    addTask,
    updateTask,
    removeTask,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}
