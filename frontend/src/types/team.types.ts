// ==========================
// USER
// ==========================
export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE"; // System role
}

// ==========================
// TEAM MEMBER (team-specific role)
// ==========================
export interface ITeamMember {
  _id: string;
  name: string;
  email: string;
  teamRole: "LEAD" | "MEMBER"; // Team-specific role
}

// ==========================
// TEAM
// ==========================
export interface ITeam {
  _id: string;
  name: string;
  description: string;
  lead: IUser; // Team lead (user)
  members: ITeamMember[];
  projects: string[];
  tasks: string[];
  chat?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================
// PAYLOADS
// ==========================
export interface CreateTeamPayload {
  name: string;
  description?: string; // <-- OPTIONAL to avoid TS errors
  leadId: string;
}

export interface AddMemberPayload {
  userId: string;
  role: "LEAD" | "MEMBER";
}
