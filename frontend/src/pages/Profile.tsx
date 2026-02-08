import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  Shield,
  Award,
  BookOpen,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Inbox,
} from 'lucide-react';
import { usersApi, invitationsApi } from '../services/api';
import type { CourseInvitation } from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'invitations'>('profile');
  const [invitations, setInvitations] = useState<CourseInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: '',
    bio: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || user.name || '',
        bio: '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'invitations' && user) {
      loadInvitations();
    }
  }, [activeTab, user]);

  const loadInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const response = await invitationsApi.getMyInvitations();
      setInvitations(response.invitations);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await invitationsApi.acceptInvitation(invitationId);
      toast.success('Invitation accepted! You are now enrolled.');
      await loadInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      await invitationsApi.declineInvitation(invitationId);
      toast.success('Invitation declined.');
      await loadInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline invitation');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedUser = await usersApi.updateProfile({
        full_name: profileData.full_name || undefined,
      });
      
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);

    try {
      await usersApi.changePassword(
        passwordData.current_password,
        passwordData.new_password
      );
      
      toast.success('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: Shield };
      case 'instructor':
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: BookOpen };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', icon: User };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7E2259] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleBadge = getRoleBadge(user.role);
  const RoleIcon = roleBadge.icon;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7E2259] to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-500/30">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {user.full_name || 'Welcome!'}
              </h1>
              <p className="text-slate-500 flex items-center gap-2 mt-1">
                <Mail size={16} />
                {user.email}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${roleBadge.bg} ${roleBadge.text}`}>
                  <RoleIcon size={14} />
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats (for students) */}
        {(user.role === 'student' || user.role === 'learner' || user.role === 'LEARNER') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{user.enrolled_courses || 0}</p>
                  <p className="text-sm text-slate-500">Courses Enrolled</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{user.completed_courses || 0}</p>
                  <p className="text-sm text-slate-500">Completed</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Award className="text-amber-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{user.total_points || 0}</p>
                  <p className="text-sm text-slate-500">Points Earned</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-[#7E2259] text-[#7E2259]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-[#7E2259] text-[#7E2259]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Security
              </button>
              {/* Show Invitations tab for learners */}
              {(user.role === 'learner' || user.role === 'LEARNER') && (
                <button
                  onClick={() => setActiveTab('invitations')}
                  className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'invitations'
                      ? 'border-[#7E2259] text-[#7E2259]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Inbox size={16} />
                  Invitations
                </button>
              )}
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Member Since
                </label>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={18} className="text-slate-400" />
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-[#7E2259] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#601a44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Change Password</h3>
                <p className="text-sm text-slate-500">
                  Update your password to keep your account secure
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    required
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    required
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E2259]/20 focus:border-[#7E2259] transition-colors"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-[#7E2259] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#601a44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-bold text-slate-900 mb-1">Course Invitations</h3>
                <p className="text-sm text-slate-500">
                  Manage invitations you've received for courses
                </p>
              </div>

              {loadingInvitations ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[#7E2259]" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No invitations yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    When instructors invite you to courses, they'll appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Requested (waiting for admin approval) */}
                  {invitations.filter(inv => inv.status === 'requested').length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        Awaiting Approval
                      </h4>
                      <div className="space-y-3">
                        {invitations.filter(inv => inv.status === 'requested').map((invitation) => (
                          <div
                            key={invitation.id}
                            className="bg-blue-50 border border-blue-100 rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-bold text-slate-800">{invitation.course_title}</h5>
                                <p className="text-xs text-slate-500 mt-1">
                                  Requested on {new Date(invitation.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold">
                                Awaiting Approval
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Invitations */}
                  {invitations.filter(inv => inv.status === 'pending').length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-amber-500" />
                        Pending Invitations
                      </h4>
                      <div className="space-y-3">
                        {invitations.filter(inv => inv.status === 'pending').map((invitation) => (
                          <div
                            key={invitation.id}
                            className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1">
                                <h5 className="font-semibold text-slate-900">
                                  {invitation.course_title || `Course #${invitation.course_id}`}
                                </h5>
                                <p className="text-sm text-slate-500 mt-1">
                                  Invited by {invitation.inviter_name || 'Instructor'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {new Date(invitation.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptInvitation(invitation.id)}
                                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                                >
                                  <CheckCircle size={16} />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleDeclineInvitation(invitation.id)}
                                  className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300 transition-colors text-sm"
                                >
                                  <XCircle size={16} />
                                  Decline
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accepted Invitations */}
                  {invitations.filter(inv => inv.status === 'accepted').length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" />
                        Accepted
                      </h4>
                      <div className="space-y-2">
                        {invitations.filter(inv => inv.status === 'accepted').map((invitation) => (
                          <div
                            key={invitation.id}
                            className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <h5 className="font-semibold text-slate-900">
                                {invitation.course_title || `Course #${invitation.course_id}`}
                              </h5>
                              <p className="text-xs text-slate-500 mt-1">
                                Accepted on {invitation.responded_at ? new Date(invitation.responded_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/student/course/${invitation.course_id}`)}
                              className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                            >
                              Go to Course
                              <Send size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Declined Invitations */}
                  {invitations.filter(inv => inv.status === 'declined').length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <XCircle size={16} className="text-red-500" />
                        Declined
                      </h4>
                      <div className="space-y-2">
                        {invitations.filter(inv => inv.status === 'declined').map((invitation) => (
                          <div
                            key={invitation.id}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                          >
                            <div>
                              <h5 className="font-semibold text-slate-500">
                                {invitation.course_title || `Course #${invitation.course_id}`}
                              </h5>
                              <p className="text-xs text-slate-400 mt-1">
                                Declined on {invitation.responded_at ? new Date(invitation.responded_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
