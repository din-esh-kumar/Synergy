// src/services/team.service.ts
import api from '../config/api';
import { Team, CreateTeamPayload } from "../types/team.types";

export const TeamService = {
  // Create team
  createTeam: async (data: CreateTeamPayload): Promise<Team> => {
    const response = await api.post("/teams", data); // /api/teams
    const res = response.data;
    return (res?.team || res?.data) as Team;
  },

  // All teams (admin/manager)
  getTeams: async (): Promise<Team[]> => {
    const response = await api.get("/teams"); // /api/teams
    const res = response.data;

    if (Array.isArray(res?.teams)) return res.teams as Team[];
    if (Array.isArray(res?.data)) return res.data as Team[];
    if (Array.isArray(res)) return res as Team[];
    return [];
  },

  // NEW: teams for current logged‑in user (employee view)
  getMyTeams: async (): Promise<Team[]> => {
    const response = await api.get("/teams/me/my-teams"); // /api/teams/me/my-teams
    const res = response.data;

    if (Array.isArray(res?.teams)) return res.teams as Team[];
    if (Array.isArray(res?.data)) return res.data as Team[];
    if (Array.isArray(res)) return res as Team[];
    return [];
  },

  // Update team
  updateTeam: async (
    id: string,
    data: CreateTeamPayload
  ): Promise<Team> => {
    const response = await api.put(`/teams/${id}`, data); // /api/teams/:id
    const res = response.data;
    return (res?.team || res?.data) as Team;
  },

  // Delete team
  deleteTeam: async (id: string): Promise<boolean> => {
    await api.delete(`/teams/${id}`); // /api/teams/:id
    return true;
  },
};

export default TeamService;
