import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Task, CreateTaskPayload } from "../../types/task.types";
import { User } from "../../types/user.types";

interface TaskFormProps {
  task?: Task | null;
  users: User[];
  currentUserRole?: string;
  onSubmit: (data: CreateTaskPayload) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  users,
  currentUserRole,
  onSubmit,
  onCancel,
}) => {
  const isEmployee = currentUserRole === "EMPLOYEE";

  const [formData, setFormData] = useState<CreateTaskPayload>({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    assignedTo: "",
    dueDate: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assignedTo:
          typeof task.assignedTo === "string"
            ? task.assignedTo
            : (task.assignedTo as any)._id,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [task]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter a task title");
      return;
    }
    if (!formData.assignedTo) {
      alert("Please select a user to assign");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold">
            {task ? "Update Status & Report" : "Create New Task"}
          </h2>
          {isEmployee && task && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Update the task status and add a brief report about what you worked on.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Task Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter task title"
          disabled={isEmployee}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/40"
        />
      </div>

      {/* Report / Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Report / Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={
            isEmployee
              ? "Write a short update: what you worked on, progress made, and any blockers..."
              : "Explain the task details, expectations, and important notes for the assignee..."
          }
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
        />
        {isEmployee && (
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Use this field as your daily task report. Keep it concise but specific.
          </p>
        )}
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            disabled={isEmployee}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/40"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Assign To + Due Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Assign To *</label>
          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            disabled={isEmployee}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/40"
          >
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            disabled={isEmployee}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700/40"
          />
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {task ? (isEmployee ? "Update Status & Report" : "Update Task") : "Create Task"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
