import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Save,
  Loader2,
  User,
  Mail,
  Lock,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { usersApi } from '../../../services/api';
import type { UserCreate, UserUpdate } from '../../../types/api';
import { toast } from 'sonner';

type UserRole = 'admin' | 'instructor' | 'student';

const ROLES = [
  { value: 'student', label: 'Student', description: 'Can enroll in and take courses' },
  { value: 'instructor', label: 'Instructor', description: 'Can create and manage courses' },
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
];

const UserForm: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!userId;

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    is_active: true,
  });

  useEffect(() => {
    if (isEditing && userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const user = await usersApi.get(parseInt(userId!));
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name || '',
        role: user.role,
        is_active: user.is_active,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch user');
      navigate('/admin/users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isEditing) {
        const updateData: UserUpdate = {
          full_name: formData.full_name || undefined,
          role: formData.role as UserRole,
          is_active: formData.is_active,
        };
        
        // Only include password if it was changed
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await usersApi.update(parseInt(userId!), updateData);
        toast.success('User updated successfully');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new users');
          setIsSaving(false);
          return;
        }

        const createData: UserCreate = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || undefined,
          role: formData.role as UserRole,
        };
        
        await usersApi.create(createData);
        toast.success('User created successfully');
      }
      navigate('/admin/users');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7E2259] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-2 text-slate-600 hover:text-[#7E2259] transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back to Users</span>
            </button>
          </div>
          <button
            type="submit"
            form="user-form"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#7E2259] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#601a44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7E2259]/20"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEditing ? 'Update' : 'Create'} User
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit User' : 'Create New User'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isEditing ? 'Update user details and permissions' : 'Add a new user to LearnSphere'}
            </p>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <User size={20} className="text-[#7E2259]" />
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isEditing}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
                  placeholder="user@example.com"
                />
              </div>
              {isEditing && (
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Password {!isEditing && '*'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!isEditing}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isEditing && (
                <p className="text-xs text-slate-500 mt-1">Leave blank to keep current password</p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Shield size={20} className="text-[#7E2259]" />
              Role & Permissions
            </h2>

            <div className="space-y-3">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.value })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.role === role.value
                      ? 'border-[#7E2259] bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{role.label}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{role.description}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.role === role.value
                          ? 'border-[#7E2259] bg-[#7E2259]'
                          : 'border-slate-300'
                      }`}
                    >
                      {formData.role === role.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Account Status</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {formData.is_active
                    ? 'User can log in and access LearnSphere'
                    : 'User is blocked from accessing LearnSphere'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  formData.is_active ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    formData.is_active ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="flex-1 py-3 px-6 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-6 rounded-xl bg-[#7E2259] text-white font-bold hover:bg-[#601a44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default UserForm;
