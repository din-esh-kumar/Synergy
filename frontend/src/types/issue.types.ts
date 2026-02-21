// src/types/issue.types.ts

export type IssueType = 'BUG' | 'TASK' | 'STORY';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IIssue {
  _id: string;
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  projectId: {
    _id: string;
    name: string;
  };
  reporter: {
    _id: string;
    name: string;
    email: string;
  };
  assignee?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  team?: {
    _id: string;
    name: string;
  } | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssuePayload {
  title: string;
  description?: string;
  type: IssueType;
  priority: IssuePriority;
  projectId: string;          // required
  assignee: string | null;
  team: string | null;
  dueDate: string | null;
  status?: IssueStatus;
}

// For updates everything can be partial, including projectId, etc.
export interface UpdateIssuePayload extends Partial<CreateIssuePayload> {}
