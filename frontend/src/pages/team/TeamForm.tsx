import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { User } from "../../types/user.types";

export interface TeamFormValues {
  name: string;
  description?: string;
  lead: string; // userId
  memberIds: string[]; // userIds
}

interface TeamFormProps {
  initialData?: {
    name?: string;
    description?: string;
    lead?: string; // userId
    memberIds?: string[]; // userIds
  };
  users: User[];
  onSubmit: (payload: TeamFormValues) => Promise<void>;
  onCancel: () => void;
}

const TeamForm: React.FC<TeamFormProps> = ({
  initialData,
  users,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [lead, setLead] = useState(initialData?.lead || "");
  const [memberIds, setMemberIds] = useState<string[]>(
    initialData?.memberIds || []
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setLead(initialData.lead || "");
      setMemberIds(initialData.memberIds || []);
    }
  }, [initialData]);

  // Debug: see what users the form receives
  useEffect(() => {
    console.log("TeamForm users prop:", users);
  }, [users]);

  const handleToggleMember = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a team name");
      return;
    }
    // If your backend requires a lead, uncomment this:
    // if (!lead) {
    //   alert("Please select a team lead");
    //   return;
    // }

    try {
      setSubmitting(true);
      await onSubmit({
        name: name.trim(),
        description: description || "",
        lead,
        memberIds,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header like ProjectForm */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {initialData ? "Edit Team" : "Create New Team"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left side: name, desc, lead */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description"
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Team Lead</label>
            <select
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select team lead</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: members list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Team Members</label>
            <span className="text-xs text-slate-500">
              {memberIds.length} selected
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 p-2 space-y-1">
            {users.length === 0 ? (
              <p className="text-xs text-slate-400 px-1 py-2">
                No users available.
              </p>
            ) : (
              users.map((u) => {
                const isSelected = memberIds.includes(u._id);
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => handleToggleMember(u._id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700"
                        : "hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-transparent"
                    }`}
                  >
                    <span className="flex flex-col text-left">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {u.email}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {u.role}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer buttons like ProjectForm */}
      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          disabled={submitting}
        >
          {initialData ? "Update Team" : "Create Team"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TeamForm;
