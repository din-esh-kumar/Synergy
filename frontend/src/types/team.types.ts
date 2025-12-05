export interface TeamUserRef {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface TeamProjectRef {
  _id: string;
  title: string;
  status?: string;
}

export interface TeamTaskRef {
  _id: string;
  title: string;
  status?: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  lead?: TeamUserRef | null;
  members: TeamUserRef[];
  projects: TeamProjectRef[];
  tasks: TeamTaskRef[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}


export interface CreateTeamPayload {
  name: string;
  description?: string;
  leadId?: string | null;
  memberIds?: string[];
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  leadId?: string | null;
  memberIds?: string[];
}

export interface AssignProjectsPayload {
  projectIds: string[];
}

export interface AssignTasksPayload {
  taskIds: string[];
}
