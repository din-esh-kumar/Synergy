import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface CreateProjectFormProps {
  onClose: () => void;
  onCreate: (project: { name: string; description?: string }) => Promise<void>;
  loading: boolean;
}

export default function CreateProjectForm({ onClose, onCreate, loading }: CreateProjectFormProps) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ name: false, description: false });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [loading, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError('Project name is required');
      return false;
    }
    if (form.name.length > 50) {
      setError('Project name must be 50 characters or less');
      return false;
    }
    if (form.description.length > 200) {
      setError('Description must be 200 characters or less');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, description: true });

    if (!validateForm()) return;

    const toastId = toast.loading('Creating project...');

    try {
      await onCreate({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      toast.success('Project created successfully!', { id: toastId });
      onClose();
    } catch (err) {
      // console.error('Error creating project:', err);
      toast.error('Failed to create project. Please try again.', { id: toastId });
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Create Project</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-xl transition-colors"
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                touched.name && error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter project name"
              required
              maxLength={50}
              disabled={loading}
            />
            <div className="flex justify-between mt-1">
              {touched.name && error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : (
                <span className="text-gray-400 text-xs">
                  {form.name.length}/50 characters
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter project description (optional)"
              maxLength={200}
              disabled={loading}
            />
            <div className="text-right mt-1">
              <span className="text-gray-400 text-xs">
                {form.description.length}/200 characters
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            )}
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}