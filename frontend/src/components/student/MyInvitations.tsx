import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Loader2, Clock, ChevronRight, BookOpen } from 'lucide-react';
import { invitationsApi } from '../../services/api';
import type { CourseInvitation } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface MyInvitationsProps {
  onAccepted?: () => void;
}

const MyInvitations: React.FC<MyInvitationsProps> = ({ onAccepted }) => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<CourseInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationsApi.getMyInvitations('pending');
      setInvitations(response.invitations);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: number) => {
    try {
      setProcessing(invitationId);
      setError(null);
      await invitationsApi.acceptInvitation(invitationId);
      await loadInvitations();
      onAccepted?.();
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
      await loadInvitations();
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 text-[#7E2259] animate-spin" />
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show anything if no pending invitations
  }

  return (
    <div className="bg-gradient-to-br from-[#7E2259]/5 to-[#7E2259]/10 rounded-2xl border border-[#7E2259]/20 shadow-sm p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#7E2259] p-2 rounded-lg">
          <Mail className="text-white w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Course Invitations</h2>
          <p className="text-sm text-slate-500">{invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="text-[#7E2259] w-4 h-4" />
                  <h3 className="font-bold text-slate-900">{invitation.course_title}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  Invited by <span className="font-medium text-slate-700">{invitation.inviter_name}</span>
                </p>
                {invitation.message && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                    "{invitation.message}"
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                  <Clock size={12} />
                  <span>{new Date(invitation.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {processing === invitation.id ? (
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                ) : (
                  <>
                    <button
                      onClick={() => handleDecline(invitation.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Decline"
                    >
                      <X size={20} />
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
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/student/invitations')}
        className="w-full mt-4 py-2 text-sm font-medium text-[#7E2259] hover:bg-[#7E2259]/5 rounded-lg transition-all flex items-center justify-center gap-1"
      >
        View all invitations
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default MyInvitations;
