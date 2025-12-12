// src/components/EMS/ProfileModal.tsx
import React, { useState, useEffect } from 'react';
import { XIcon, UserIcon, MailIcon, PhoneIcon, ShieldIcon, CameraIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth() as any;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        jobTitle: user.jobTitle || '',
      });
      setAvatarPreview(user.avatarUrl || null);
      setAvatarFile(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar must be less than 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...formData };
      if (avatarFile) payload.avatar = avatarFile;
      if (typeof updateProfile === 'function') {
        await updateProfile(payload);
      }
      onClose();
    } catch (err) {
      console.error('Profile update failed', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-600" />
            Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-semibold">
                  {user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1.5 cursor-pointer shadow-md">
                <CameraIcon className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role}
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Full name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Email
            </label>
            <div className="relative">
              <MailIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                disabled
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                value={formData.email}
              />
            </div>
          </div>

          {/* Phone & Job title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Phone
              </label>
              <div className="relative">
                <PhoneIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Job title
              </label>
              <div className="relative">
                <ShieldIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.jobTitle}
                  onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
            </div>
          </div>

          {/* Role info */}
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-700 px-4 py-3 text-xs text-indigo-900 dark:text-indigo-100 flex justify-between">
            <div>
              <p className="font-semibold">Role: {user?.role}</p>
              <p className="text-[11px] mt-1">
                Role and permissions are managed by administrators and cannot be changed here.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
