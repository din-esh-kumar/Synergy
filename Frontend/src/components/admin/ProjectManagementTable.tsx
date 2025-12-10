import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import ConfirmationModal from '../ConfirmationModal';
import CreateProjectForm from '../forms/CreateProjectForm';
import toast from 'react-hot-toast';

type ConfirmModalState = {
  isOpen: boolean;
  projectId: string | null;
};

export default function ProjectManagementTable() {
  const { 
    projects, 
    fetchAllProjects, 
    deleteProject, 
    loading, 
    createProject, 
    error, 
    clearError, 
    updateProject 
  } = useAdminStore();

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    projectId: null,
  });

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, projectId: id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.projectId) return;
    setActionLoadingId(confirmModal.projectId);
    try {
      await deleteProject(confirmModal.projectId);
      toast.success('Project deleted successfully!');
      setConfirmModal({ isOpen: false, projectId: null });
    } catch (error) {
      // console.error('Failed to delete project:', error);
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActive = async (id: string, newStatus: boolean) => {
    setActionLoadingId(id);
    try {
      await updateProject(id, { isActive: newStatus });
      toast.success(`Project ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      // console.error('Failed to toggle project status:', error);
      toast.error('Failed to update project status. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateProject = async (form: { name: string; description?: string }) => {
    setFormLoading(true);
    try {
      await createProject(form);
      setShowCreateModal(false);
    } catch (error) {
      // console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Enhanced skeleton loader
  if (loading && projects.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header Skeleton */}
        <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Name", "Code", "Description", "Status", "Actions"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-8 bg-gray-200 rounded w-24 ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Project Management</h2>
            <p className="text-gray-600 text-sm">Manage and organize your projects</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
          >
            <i className="fa-solid fa-plus mr-2"></i>Create Project
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-folder-open text-gray-400 text-2xl mb-2"></i>
                      <p>No projects found</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                      >
                        Create your first project
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const isLoading = actionLoadingId === project.id;
                  
                  return (
                    <tr 
                      key={project.id} 
                      className={`
                        hover:bg-gray-50 transition-all duration-200
                        ${isLoading ? 'opacity-50' : ''}
                        ${!project.isActive ? 'bg-gray-100' : ''}
                      `}
                    >
                      {isLoading ? (
                        <td colSpan={5} className="px-4 py-4 text-center">
                          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Updating...
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900 font-mono">
                            {project.code || '-'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {project.description || (
                              <span className="text-gray-400">No description</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                project.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {project.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleToggleActive(project.id, !project.isActive)}
                              disabled={isLoading}
                              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                project.isActive
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-green-100 text-green-800 hover:bg-green-200"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {project.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete project"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, projectId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
        loading={actionLoadingId !== null}
      />

      {showCreateModal && (
        <CreateProjectForm
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
          loading={formLoading}
        />
      )}
    </div>
  );
}