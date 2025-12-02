// src/pages/team/TeamsHome.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { teamService } from '../../services/team.service';
import userService from '../../services/user.service';
import { User } from '../../types/user.types';
import { showToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import TeamForm from './TeamForm';
import { ITeam, CreateTeamPayload } from '../../types/team.types';

const TeamsHome: React.FC = () => {
  const { user } = useAuth();

  const [teams, setTeams] = useState<ITeam[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<ITeam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ITeam | null>(null);

  const canManageTeams = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Load teams
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teamService.getTeams();
      const list = Array.isArray(data) ? data : [];
      setTeams(list);
    } catch (error) {
      console.error('Error fetching teams:', error);
      showToast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users
  const fetchUsers = useCallback(async () => {
    try {
      const list = await userService.getAllUsers();
      setUsers(list);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.error('Failed to load users for teams');
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, [fetchTeams, fetchUsers]);

  // Search filtering
  useEffect(() => {
    let filtered = [...teams];
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        team =>
          team.name.toLowerCase().includes(term) ||
          (team.description?.toLowerCase() || '').includes(term)
      );
    }
    setFilteredTeams(filtered);
  }, [teams, search]);

  // Create Team
  const handleCreateTeam = async (payload: {
    name: string;
    description?: string;
    lead: string;
  }) => {
    const fullPayload: CreateTeamPayload = {
      name: payload.name,
      description: payload.description ?? "",
      leadId: payload.lead
    };

    try {
      const created = await teamService.createTeam(fullPayload);
      if (created) {
        showToast.success('Team created successfully! 🚀');
        setShowForm(false);
        setEditingTeam(null);
        await fetchTeams();
      }
    } catch (error) {
      console.error('Error creating team:', error);
      showToast.error('Failed to create team');
    }
  };

  // Update Team
  const handleUpdateTeam = async (payload: {
    name: string;
    description?: string;
    lead: string;
  }) => {
    if (!editingTeam?._id) return;

    const fullPayload: Partial<CreateTeamPayload> = {
      name: payload.name,
      description: payload.description ?? "",
      leadId: payload.lead
    };

    try {
      const updated = await teamService.updateTeam(editingTeam._id, fullPayload);
      if (updated) {
        showToast.success('Team updated successfully! ✏️');
        setShowForm(false);
        setEditingTeam(null);
        await fetchTeams();
      }
    } catch (error) {
      console.error('Error updating team:', error);
      showToast.error('Failed to update team');
    }
  };

  // Delete team
  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      const deleted = await teamService.deleteTeam(id);
      if (deleted) {
        showToast.success('Team deleted successfully! 🗑️');
        await fetchTeams();
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      showToast.error('Failed to delete team');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Teams</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Organize people into cross-functional teams.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams..."
              className="w-56 pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {canManageTeams && (
            <button
              onClick={() => {
                setEditingTeam(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus size={16} />
              New Team
            </button>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && canManageTeams && (
        <TeamForm
          initialData={
            editingTeam
              ? {
                  name: editingTeam.name,
                  description: editingTeam.description,
                  lead: editingTeam.lead?._id
                }
              : undefined
          }
          users={users}
          onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
          onCancel={() => {
            setShowForm(false);
            setEditingTeam(null);
          }}
        />
      )}

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            <p className="mb-2">No teams yet.</p>
            {canManageTeams && <p>Click “New Team” to create your first team.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTeams.map(team => (
              <div
                key={team._id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 hover:border-blue-500/60 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">{team.name}</h3>
                    {team.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                    <Users size={16} />
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span>{team.members?.length || 0} members</span>
                  {team.lead && (
                    <span>
                      Owner: <span className="font-medium">{team.lead.name}</span>
                    </span>
                  )}
                </div>

                {canManageTeams && (
                  <div className="flex justify-between text-xs">
                    <button
                      className="text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => {
                        setEditingTeam(team);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-700 font-medium"
                      onClick={() => handleDeleteTeam(team._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsHome;
