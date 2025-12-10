import {
  createContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';
import { TeamService } from '../services/team.service';

export interface Team {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  lead?: any;
  members?: any[];
  projects?: any[];
  tasks?: any[];
  createdAt?: string;
}

export interface TeamContextType {
  teams: Team[];
  loading: boolean;
  error: string | null;
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  removeTeam: (teamId: string) => void;
}

export const TeamContext = createContext<TeamContextType | undefined>(
  undefined,
);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Initial load of teams (so useTeams works on Issues page etc.)
  useEffect(() => {
    if (!user) return;

    const loadTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await TeamService.getTeams();
        setTeams(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Error loading teams in TeamProvider:', err);
        setError(err?.message || 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    if (!teams || teams.length === 0) {
      loadTeams();
    }
  }, [user]); // intentionally not including teams to avoid refetch loops

  const addTeam = useCallback((team: Team) => {
    setTeams((prev) => [...prev, team]);
  }, []);

  const updateTeam = useCallback(
    (teamId: string, updates: Partial<Team>) => {
      setTeams((prev) =>
        prev.map((t) =>
          t._id === teamId || t.id === teamId ? { ...t, ...updates } : t,
        ),
      );
    },
    [],
  );

  const removeTeam = useCallback((teamId: string) => {
    setTeams((prev) =>
      prev.filter((t) => t._id !== teamId && t.id !== teamId),
    );
  }, []);

  // Listen for real-time team updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTeamCreated = (team: Team) => {
      console.log('👥 Team created:', team);
      addTeam(team);
    };

    const handleTeamUpdated = (data: {
      teamId: string;
      updates: Partial<Team>;
    }) => {
      console.log('✏️ Team updated:', data);
      updateTeam(data.teamId, data.updates);
    };

    const handleTeamDeleted = (data: { teamId: string }) => {
      console.log('🗑️ Team deleted:', data);
      removeTeam(data.teamId);
    };

    socket.on('team:created', handleTeamCreated);
    socket.on('team:updated', handleTeamUpdated);
    socket.on('team:deleted', handleTeamDeleted);

    return () => {
      socket.off('team:created', handleTeamCreated);
      socket.off('team:updated', handleTeamUpdated);
      socket.off('team:deleted', handleTeamDeleted);
    };
  }, [socket, isConnected, addTeam, updateTeam, removeTeam]);

  const value: TeamContextType = {
    teams,
    loading,
    error,
    setTeams,
    addTeam,
    updateTeam,
    removeTeam,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}
