import { useAuthStore } from '../store/authStore';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || ''
      });
      setEditing(false);
    }
  }, [open, user]);

  const avatarInitial =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toastId = toast.loading('Updating profile...');

    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!', { id: toastId });
      setEditing(false);
    } catch (err) {
      // // console.error('Profile update failed:', err);
      // toast.error('Failed to update profile. Please try again.', { id: toastId });
      // toast.error(err instanceof Error ? err.message : 'Failed to update profile. Please try again.', { id: toastId });
    }
  };

  if (!open) return null;

  return (
    <div>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Profile</h2>
              <button
                className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center transition-all duration-200 text-gray-500 hover:text-gray-700"
                onClick={onClose}
                aria-label="Close"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Avatar and Profile Info */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {avatarInitial}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-3 border-white rounded-full shadow-sm"></div>
              </div>

              {!editing ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">{user?.email}</p>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full capitalize">
                    {user?.role}
                  </span>
                </>
              ) : (
                <div className="w-full space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  <i className="fas fa-edit text-sm"></i>
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin text-sm"></i>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save text-sm"></i>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}