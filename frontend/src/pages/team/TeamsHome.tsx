import React, { useEffect, useState, useCallback } from "react";
import { Users, Plus, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../components/common/Toast";
import userService from "../../services/user.service";
import { User } from "../../types/user.types";

import { TeamService } from "../../services/team.service";
import { Team, CreateTeamPayload } from "../../types/team.types";
import TeamForm from "./TeamForm";
import TeamList from "./TeamList";

const TeamsHome: React.FC = () => {
  const { user } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const canManageTeams = user?.role === "ADMIN" || user?.role === "MANAGER";

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await TeamService.getTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      showToast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const list = await userService.getAllUsers();
      console.log("TeamsHome users:", list);
      setUsers(list);
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast.error("Failed to load users for teams");
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, [fetchTeams, fetchUsers]);

  useEffect(() => {
    let filtered = [...teams];
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          (t.description?.toLowerCase() || "").includes(term)
      );
    }
    setFilteredTeams(filtered);
  }, [teams, search]);

  const handleCreateTeam = async (data: {
  name: string;
  description?: string;
  lead: string;
  memberIds: string[];
}) => {
  const payload: CreateTeamPayload = {
    name: data.name,
    description: data.description ?? "",
    leadId: data.lead || null,
    memberIds: data.memberIds,
  };

  try {
    console.log("CreateTeam payload:", payload);
    const created = await TeamService.createTeam(payload);
    console.log("CreateTeam response:", created);
    showToast.success("Team created successfully! 🚀");
    setShowForm(false);
    setEditingTeam(null);
    await fetchTeams();
  } catch (error: any) {
    console.error("Error creating team:", error?.response?.data || error);
    showToast.error(
      error?.response?.data?.message || "Failed to create team"
    );
  }
};

  const handleUpdateTeam = async (data: {
    name: string;
    description?: string;
    lead: string;
    memberIds: string[];
  }) => {
    if (!editingTeam?._id) return;

    const payload: CreateTeamPayload = {
      name: data.name,
      description: data.description ?? "",
      leadId: data.lead || null,
      memberIds: data.memberIds,
    };

    try {
      console.log("UpdateTeam payload:", payload);
      await TeamService.updateTeam(editingTeam._id, payload);
      showToast.success("Team updated successfully! ✏️");
      setEditingTeam(null);
      setShowForm(false);
      await fetchTeams();
    } catch (error: any) {
      console.error("Error updating team:", error?.response?.data || error);
      showToast.error(
        error?.response?.data?.message || "Failed to update team"
      );
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure? This will delete the team.")) return;
    try {
      await TeamService.deleteTeam(id);
      showToast.success("Team deleted successfully! 🗑️");
      await fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      showToast.error("Failed to delete team");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 mb-2">
            <Users size={32} className="text-blue-600 dark:text-blue-400" />
            Teams
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize people into cross‑functional teams.
          </p>
        </div>
        {canManageTeams && (
          <button
            onClick={() => {
              setEditingTeam(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all"
          >
            <Plus size={20} />
            New Team
          </button>
        )}
      </div>

      {/* Form card */}
      {showForm && (
        <div className="mb-8 bg-white text-slate-900 dark:bg-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <TeamForm
            initialData={
              editingTeam
                ? {
                    name: editingTeam.name,
                    description: editingTeam.description,
                    lead: editingTeam.lead?._id || "",
                    memberIds:
                      editingTeam.members?.map((m: any) => m._id) || [],
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
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <p>Loading teams...</p>
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamList
              key={team._id}
              team={team}
              canEdit={canManageTeams}
              onEdit={() => {
                setEditingTeam(team);
                setShowForm(true);
              }}
              onDelete={() => handleDeleteTeam(team._id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No teams found
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamsHome;
