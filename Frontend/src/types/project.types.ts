export interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: Date;
  endDate?: Date;
  owner: {
    _id: string;
    name: string;
    email: string;
  } | string;
  team: Array<{
    _id: string;
    name: string;
    email: string;
  }> | string[];
  budget?: number;
  visibility: 'PRIVATE' | 'PUBLIC';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  visibility?: 'PRIVATE' | 'PUBLIC';
  team?: string[];
  budget?: number;
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {}
