import React, { useEffect, useState, useCallback } from 'react';
import { Briefcase, Plus, Search, Filter } from 'lucide-react';
import projectsService from '../../services/projects.service';
import {
  Project,
  CreateProjectPayload,
} from '../../types/project.types';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/common/Toast';
import ProjectForm from './ProjectForm';
import ProjectList from './ProjectList';

type FilterStatus =
  | 'all'
  | 'planning'
  | 'active'
  | 'on-hold'
  | 'completed'
  | 'cancelled';
type FilterVisibility = 'all' | 'private' | 'public';

const ProjectsHome: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [visibilityFilter, setVisibilityFilter] =
    useState<FilterVisibility>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 30000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  useEffect(() => {
    let filtered = [...projects];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) =>
        p.status.toLowerCase().replace('_', '-') === statusFilter
      );
    }

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter((p) =>
        p.visibility.toLowerCase() === visibilityFilter
      );
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    setFilteredProjects(filtered);
  }, [projects, statusFilter, visibilityFilter, search]);

  const handleCreateProject = async (data: CreateProjectPayload) => {
  try {
    console.log("CreateProject payload:", data);
    const created = await projectsService.createProject(data);
    console.log("CreateProject response:", created);
    if (created) {
      showToast.success("Project created successfully! 🚀");
      setShowForm(false);
      await fetchProjects();
    }
  } catch (error: any) {
    console.error(
      "Error creating project:",
      error?.response?.data || error
    );
    showToast.error(
      error?.response?.data?.message || "Failed to create project"
    );
  }
};


  const handleUpdateProject = async (data: CreateProjectPayload) => {
    if (!editingProject?._id) return;
    try {
      const updated = await projectsService.updateProject(
        editingProject._id,
        data
      );
      if (updated) {
        showToast.success('Project updated successfully! ✏️');
        setEditingProject(null);
        setShowForm(false);
        await fetchProjects();
      }
    } catch (error) {
      console.error('Error updating project:', error);
      showToast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (
      !confirm(
        'Are you sure? This will delete the project and all associated tasks.'
      )
    )
      return;
    try {
      const deleted = await projectsService.deleteProject(id);
      if (deleted) {
        showToast.success('Project deleted successfully! 🗑️');
        await fetchProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast.error('Failed to delete project');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 mb-2">
            <Briefcase size={32} className="text-purple-600 dark:text-purple-400" />
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and organize your projects
          </p>
        </div>
        {user?.role !== 'EMPLOYEE' && (
          <button
            onClick={() => {
              setEditingProject(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all"
          >
            <Plus size={20} />
            New Project
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 bg-white text-slate-900 dark:bg-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <ProjectForm
            project={editingProject}
            onSubmit={
              editingProject
                ? handleUpdateProject
                : handleCreateProject
            }
            onCancel={() => {
              setShowForm(false);
              setEditingProject(null);
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            'all',
            'planning',
            'active',
            'on-hold',
            'completed',
            'cancelled',
          ] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                statusFilter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'private', 'public'] as const).map((visibility) => (
            <button
              key={visibility}
              onClick={() => setVisibilityFilter(visibility)}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                visibilityFilter === visibility
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Filter size={16} />
              {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <p>Loading projects...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectList
              key={project._id}
              project={project}
              currentUserId={user?._id}
              onEdit={() => {
                setEditingProject(project);
                setShowForm(true);
              }}
              onDelete={() => handleDeleteProject(project._id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No projects found
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectsHome;
