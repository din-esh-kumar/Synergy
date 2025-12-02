// src/services/team.service.ts
import api from './api';
import { CreateTeamPayload, ITeam } from '../types/team.types';

export const teamService = {
  // Get all teams
  async getTeams(): Promise<ITeam[]> {
    try {
      const response = await api.get('/teams');
      const data = response.data;
      if (Array.isArray(data?.teams)) return data.teams as ITeam[];
      if (Array.isArray(data)) return data as ITeam[];
      return [];
    } catch (error: any) {
      console.error('Error fetching teams:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get single team
  async getTeamById(id: string): Promise<ITeam | null> {
    try {
      const response = await api.get(`/teams/${id}`);
      const data = response.data;
      return (data?.team || data || null) as ITeam | null;
    } catch (error: any) {
      console.error('Error fetching team:', error);
      throw error.response?.data || error.message;
    }
  },

  // Create team
  async createTeam(payload: CreateTeamPayload): Promise<ITeam> {
    try {
      const response = await api.post('/teams', payload);
      const data = response.data;
      return (data?.team || data) as ITeam;
    } catch (error: any) {
      console.error('Error creating team:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update team
  async updateTeam(
    id: string,
    payload: Partial<CreateTeamPayload>
  ): Promise<ITeam> {
    try {
      const response = await api.put(`/teams/${id}`, payload);
      const data = response.data;
      return (data?.team || data) as ITeam;
    } catch (error: any) {
      console.error('Error updating team:', error);
      throw error.response?.data || error.message;
    }
  },

  // Delete team
  async deleteTeam(id: string): Promise<boolean> {
    try {
      await api.delete(`/teams/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting team:', error);
      throw error.response?.data || error.message;
    }
  },
};

export default teamService;