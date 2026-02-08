import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { invitationsApi } from '../../services/api';
import type { CourseInvitation } from '../../services/api';
import {
  Mail,
  Check,
  X,
  Loader2,
  Clock,
  BookOpen,
  GraduationCap,
  LogOut,
  User,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'accepted' | 'declined';

const InvitationsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<CourseInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const displayName = user?.name || "Student";

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    loadInvitations();
  }, [filter]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const response = await invitationsApi.getMyInvitations(statusFilter);
      setInvitations(response.invitations);
    } catch (err) {
      console.error('Failed to load invitations:', err);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: number) => {
    try {
      setProcessing(invitationId);
      setError(null);
      await invitationsApi.acceptInvitation(invitationId);
      setSuccess('Invitation accepted! You are now enrolled in the course.');
      await loadInvitations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (invitationId: number) => {
    try {
      setProcessing(invitationId);
      setError(null);
      await invitationsApi.declineInvitation(invitationId);
      setSuccess('Invitation declined.');
      await loadInvitations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-amber-500" size={18} />;
      case 'accepted':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'declined':
        return <XCircle className="text-red-500" size={18} />;
      case 'expired':
        return <AlertCircle className="text-gray-400" size={18} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      accepted: 'bg-green-50 text-green-600 border-green-200',
      declined: 'bg-red-50 text-red-600 border-red-200',
      expired: 'bg-gray-50 text-gray-500 border-gray-200',
    };
    return styles[status] || styles.pending;
  };

  const filterTabs: { id: FilterStatus; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'declined', label: 'Declined' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800">
      {/* Header / Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-[#7E2259] p-1.5 rounded-lg transition-transform hover:scale-105">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-[#7E2259] tracking-tight">Learn Sphere</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/profile')}
              className="text-slate-400 hover:text-[#7E2259] transition-colors p-2 rounded-full hover:bg-slate-50"
              title="My Profile"
            >
              <User size={20} />
            </button>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-[#7E2259] transition-colors p-2 rounded-full hover:bg-slate-50"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 border-l border-slate-200 pl-6 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-tight">{displayName}</p>
                <p className="text-xs text-slate-500">Student ID: #{user?.id || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#7E2259]/10 border border-[#7E2259]/20 flex items-center justify-center text-[#7E2259] font-bold text-sm shadow-sm">
                {getInitials(displayName)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button & Title */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-[#7E2259] transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-[#7E2259] p-2.5 rounded-xl">
              <Mail className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Course Invitations</h1>
              <p className="text-slate-500">View and manage your course invitations</p>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 mb-4">
            <XCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 mb-4">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-slate-100 shadow-sm">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                filter === tab.id
                  ? 'bg-[#7E2259] text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Invitations List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#7E2259] animate-spin" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg mb-2">No invitations found</p>
              <p className="text-slate-400 text-sm">
                {filter === 'pending'
                  ? "You don't have any pending invitations."
                  : filter === 'accepted'
                  ? "You haven't accepted any invitations yet."
                  : filter === 'declined'
                  ? "You haven't declined any invitations."
                  : "You haven't received any course invitations yet."}
              </p>
            </div>
          ) : (
            invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-[#7E2259]/10 p-2 rounded-lg">
                        <BookOpen className="text-[#7E2259] w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{invitation.course_title}</h3>
                        <p className="text-sm text-slate-500">
                          Invited by <span className="font-medium text-slate-700">{invitation.inviter_name}</span>
                        </p>
                      </div>
                    </div>

                    {invitation.message && (
                      <div className="bg-slate-50 p-4 rounded-xl mt-3 mb-3">
                        <p className="text-sm text-slate-600 italic">"{invitation.message}"</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{new Date(invitation.created_at).toLocaleDateString()}</span>
                      </div>
                      {invitation.responded_at && (
                        <div className="flex items-center gap-1">
                          {getStatusIcon(invitation.status)}
                          <span>Responded: {new Date(invitation.responded_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-4 py-1.5 rounded-lg text-sm font-bold border ${getStatusBadge(invitation.status)}`}>
                      {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                    </span>

                    {invitation.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        {processing === invitation.id ? (
                          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleDecline(invitation.id)}
                              className="px-4 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                            >
                              <X size={16} />
                              Decline
                            </button>
                            <button
                              onClick={() => handleAccept(invitation.id)}
                              className="px-4 py-2 bg-[#7E2259] text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#6B1E4A] transition-all shadow-md shadow-[#7E2259]/20"
                            >
                              <Check size={16} />
                              Accept
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {invitation.status === 'accepted' && (
                      <button
                        onClick={() => navigate(`/student/course/${invitation.course_id}`)}
                        className="px-4 py-2 bg-[#7E2259]/10 text-[#7E2259] rounded-lg font-bold text-sm hover:bg-[#7E2259]/20 transition-all"
                      >
                        Go to Course
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center border-t border-slate-200 mt-8">
        <p className="text-sm text-slate-400">
          © 2026 Learn Sphere. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default InvitationsPage;
