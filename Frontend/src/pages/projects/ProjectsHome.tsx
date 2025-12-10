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






















































// // src/pages/projects/ProjectsHome.tsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Plus, Search, Filter, MoreVertical, Trash2, Edit } from 'lucide-react';
// import { useProjectStore } from '../../store/projectStore';
// import toast from 'react-hot-toast';

// const ProjectsHome: React.FC = () => {
//   const navigate = useNavigate();
//   const { projects, deleteProject } = useProjectStore();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState<string>('all');

//   const filteredProjects = projects?.filter((project) => {
//     const matchesSearch = project?.name?.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = filterStatus === 'all' || project?.status === filterStatus;
//     return matchesSearch && matchesStatus;
//   }) || [];

//   const handleDelete = (id: string) => {
//     if (confirm('Are you sure you want to delete this project?')) {
//       deleteProject(id);
//       toast.success('Project deleted successfully');
//     }
//   };

//   const getStatusColor = (status: string) => {
//     const colors: { [key: string]: string } = {
//       active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
//       pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
//       completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
//       archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
//     };
//     return colors[status] || colors.pending;
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects</h1>
//           <p className="text-slate-600 dark:text-slate-400">Manage and track all projects</p>
//         </div>
//         <button
//           onClick={() => navigate('/projects/new')}
//           className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
//         >
//           <Plus className="w-5 h-5" />
//           New Project
//         </button>
//       </div>

//       {/* Search & Filter */}
//       <div className="flex flex-col md:flex-row gap-4">
//         <div className="flex-1 relative">
//           <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
//           <input
//             type="text"
//             placeholder="Search projects..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />
//         </div>
//         <div className="flex items-center gap-2">
//           <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
//           <select
//             value={filterStatus}
//             onChange={(e) => setFilterStatus(e.target.value)}
//             className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           >
//             <option value="all">All Status</option>
//             <option value="active">Active</option>
//             <option value="pending">Pending</option>
//             <option value="completed">Completed</option>
//             <option value="archived">Archived</option>
//           </select>
//         </div>
//       </div>

//       {/* Projects Table */}
//       <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
//         {filteredProjects.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Project Name
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Progress
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Team Members
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredProjects.map((project) => (
//                   <tr
//                     key={project.id}
//                     className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
//                   >
//                     <td className="px-6 py-4">
//                       <div>
//                         <p className="font-semibold text-slate-900 dark:text-white">
//                           {project.name}
//                         </p>
//                         <p className="text-sm text-slate-600 dark:text-slate-400">
//                           {project.description}
//                         </p>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
//                         {project.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-2">
//                         <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
//                           <div
//                             className="bg-indigo-600 h-2 rounded-full"
//                             style={{ width: `${project.progress || 0}%` }}
//                           ></div>
//                         </div>
//                         <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
//                           {project.progress || 0}%
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className="text-sm text-slate-600 dark:text-slate-400">
//                         {project.teamMembers?.length || 0} members
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="flex items-center gap-2">
//                         <button
//                           onClick={() => navigate(`/projects/${project.id}`)}
//                           className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors"
//                           title="Edit"
//                         >
//                           <Edit className="w-4 h-4" />
//                         </button>
//                         <button
//                           onClick={() => handleDelete(project.id)}
//                           className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
//                           title="Delete"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="text-center py-12">
//             <p className="text-slate-600 dark:text-slate-400 mb-4">No projects found</p>
//             <button
//               onClick={() => navigate('/projects/new')}
//               className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
//             >
//               Create First Project
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Stats Card */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Total Projects</p>
//           <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
//             {projects?.length || 0}
//           </p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Active Projects</p>
//           <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
//             {projects?.filter((p) => p.status === 'active').length || 0}
//           </p>
//         </div>
//         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
//           <p className="text-slate-600 dark:text-slate-400 text-sm">Completed</p>
//           <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
//             {projects?.filter((p) => p.status === 'completed').length || 0}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProjectsHome;