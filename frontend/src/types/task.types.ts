export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId?: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  } | string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  } | string;
  dueDate?: Date;
  startDate?: Date;
  completedDate?: Date;
  tags?: string[];
  comments?: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    text: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId?: string;
  assignedTo: string;
  dueDate?: string;
  startDate?: string;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}
