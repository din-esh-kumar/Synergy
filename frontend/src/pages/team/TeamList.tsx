import React from "react";
import { Users, FolderKanban } from "lucide-react";
import { Team } from "../../types/team.types";

interface TeamListProps {
  team: Team;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const TeamList: React.FC<TeamListProps> = ({
  team,
  canEdit,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{team.name}</h3>
          {team.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
              {team.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
            <Users size={16} />
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Users size={14} />
          <span>{team.members?.length || 0} members</span>
        </div>
        <div className="flex items-center gap-2">
          <FolderKanban size={14} />
          <span>{team.projects?.length || 0} projects</span>
        </div>
        {team.lead && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Lead: <span className="font-medium">{team.lead.name}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          Created: {new Date(team.createdAt).toLocaleDateString()}
        </span>

        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/60"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1 rounded-lg bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/60"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamList;
