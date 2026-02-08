import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Clock, CheckCircle, XCircle, Loader2, AlertCircle, User, Search, UserPlus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { invitationsApi, usersApi } from '../../services/api';
import type { CourseInvitation } from '../../services/api';
import type { User as UserType } from '../../types/api';

interface InvitationManagerProps {
  courseId: number;
}

const InvitationManager: React.FC<InvitationManagerProps> = ({ courseId }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [invitations, setInvitations] = useState<CourseInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Search state
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInvitations();
  }, [courseId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationsApi.getCourseInvitations(courseId);
      setInvitations(response.invitations);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setSelectedUser(null);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    if (value.length >= 2) {
      setIsSearching(true);
      setShowDropdown(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const users = await usersApi.searchLearners(value);
          setSearchResults(users);
        } catch (err) {
          console.error('Search failed:', err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectUser = (user: UserType) => {
    setSelectedUser(user);
    setEmail(user.email);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleSendInvitation = async () => {
    if (!email.trim()) return;

    try {
      setSending(true);
      setError(null);
      console.log('Sending invitation to:', { courseId, email: email.trim(), message: message.trim() });
      const result = await invitationsApi.sendInvitation(courseId, email.trim(), message.trim() || undefined);
      console.log('Invitation sent successfully:', result);
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      setMessage('');
      setSelectedUser(null);
      await loadInvitations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to send invitation:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await invitationsApi.cancelInvitation(invitationId);
      setSuccess('Invitation cancelled');
      await loadInvitations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel invitation');
    }
  };

  const handleApproveRequest = async (invitationId: number) => {
    try {
      await invitationsApi.approveRequest(invitationId);
      setSuccess('Request approved - invitation sent to learner');
      await loadInvitations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (invitationId: number) => {
    try {
      await invitationsApi.rejectRequest(invitationId);
      setSuccess('Request rejected');
      await loadInvitations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-amber-500" size={16} />;
      case 'accepted':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'declined':
        return <XCircle className="text-red-500" size={16} />;
      case 'requested':
        return <UserPlus className="text-blue-500" size={16} />;
      case 'expired':
        return <AlertCircle className="text-gray-400" size={16} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      accepted: 'bg-green-50 text-green-600 border-green-200',
      declined: 'bg-red-50 text-red-600 border-red-200',
      requested: 'bg-blue-50 text-blue-600 border-blue-200',
      expired: 'bg-gray-50 text-gray-500 border-gray-200',
    };
    return styles[status] || styles.pending;
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
      {/* Send Invitation Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500">Invite Learner by Email:</label>
          <div className="flex gap-3">
            <div className="flex-1 relative" ref={dropdownRef}>
              {/* Selected user badge */}
              {selectedUser && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {getInitials(selectedUser.name, selectedUser.email)}
                  </div>
                  <span className="text-xs font-bold">{selectedUser.name || selectedUser.email}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setEmail(''); }}
                    className="text-purple-500 hover:text-purple-700"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              
              <input
                type="text"
                value={selectedUser ? '' : email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder={selectedUser ? '' : 'Search by email...'}
                className={`w-full bg-slate-50/50 border border-slate-100 rounded-xl pr-4 py-3 text-slate-700 font-bold outline-none focus:border-[#7E2259]/30 transition-all ${selectedUser ? 'pl-48' : 'pl-10'}`}
                disabled={sending || !!selectedUser}
                onFocus={() => email.length >= 2 && setShowDropdown(true)}
              />
              {!selectedUser && (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              )}
              
              {/* Search Dropdown */}
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="animate-spin" size={16} />
                      <span className="text-sm">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold">
                            {getInitials(user.name, user.email)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 truncate">
                              {user.name || 'No Name'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          </div>
                          <User size={16} className="text-slate-300" />
                        </button>
                      ))}
                    </div>
                  ) : email.length >= 2 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-500">No learners found with "{email}"</p>
                      <p className="text-xs text-slate-400 mt-1">You can still send invitation to this email</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSendInvitation}
              disabled={sending || !email.trim()}
              className="bg-[#7E2259] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#6D1F4D] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
              Send
            </button>
          </div>
          <p className="text-[11px] text-slate-400 ml-1">
            Type at least 2 characters to search registered learners, or enter any email address
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400">Optional Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message to the invitation..."
            rows={2}
            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700 font-medium outline-none focus:border-[#7E2259]/30 transition-all resize-none text-sm"
            disabled={sending}
          />
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <XCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Invitations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-500">Sent Invitations:</label>
          <span className="text-xs font-bold text-slate-400">{invitations.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : invitations.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-6 text-center text-sm text-slate-400 font-medium">
            No invitations sent yet. Search and invite learners above.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between group hover:bg-slate-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(invitation.status)}
                  <div>
                    <p className="text-sm font-bold text-slate-700">{invitation.invitee_email}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(invitation.status)}`}>
                    {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                  </span>
                  {invitation.status === 'requested' && (
                    <>
                      <button
                        onClick={() => handleApproveRequest(invitation.id)}
                        className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                        title="Approve request"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(invitation.id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                        title="Reject request"
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </>
                  )}
                  {invitation.status === 'pending' && (
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                      title="Cancel invitation"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] font-bold text-slate-300 italic">
        Invited learners will receive a notification and can accept or decline the invitation.
      </p>
    </div>
  );
};

export default InvitationManager;
