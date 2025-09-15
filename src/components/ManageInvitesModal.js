/**
 * Manage Invites Modal Component
 * Modal for creating and managing event invitation codes
 */

const { useState, useEffect } = React;

/**
 * ManageInvitesModal component
 * Handles invitation code creation, listing, and deletion
 */
function ManageInvitesModal({ event, isOpen, onClose, onInviteCreated }) {
  const { sessionToken } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'generic',
    description: '',
  });
  const [copiedInviteCode, setCopiedInviteCode] = useState(null);

  /**
   * Fetch invitations for the event
   */
  const fetchInvitations = async () => {
    if (!event?.eventId || !sessionToken) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3001/api/invitations/event/${event.eventId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setInvitations(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch invitations');
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new invitation
   */
  const handleCreateInvitation = async () => {
    if (!event?.eventId || !sessionToken) return;

    try {
      setCreating(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          eventId: event.eventId,
          type: createForm.type,
          description: createForm.description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInvitations([...invitations, data.data]);
        setCreateForm({ type: 'generic', description: '' });
        setShowCreateForm(false);
        if (onInviteCreated) {
          onInviteCreated();
        }
      } else {
        setError(data.message || 'Failed to create invitation');
      }
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError('Failed to create invitation');
    } finally {
      setCreating(false);
    }
  };

  /**
   * Delete an invitation
   */
  const handleDeleteInvitation = async (inviteCode) => {
    if (!sessionToken) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/invitations/${inviteCode}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setInvitations(
          invitations.filter((inv) => inv.inviteCode !== inviteCode)
        );
      } else {
        setError(data.message || 'Failed to delete invitation');
      }
    } catch (err) {
      console.error('Error deleting invitation:', err);
      setError('Failed to delete invitation');
    }
  };

  /**
   * Copy invite code to clipboard
   */
  const copyToClipboard = (inviteCode) => {
    const inviteUrl = `${window.location.origin}/#invite/${inviteCode}`;
    navigator.clipboard
      .writeText(inviteUrl)
      .then(() => {
        // Show visual feedback
        setCopiedInviteCode(inviteCode);
        // Hide feedback after 2 seconds
        setTimeout(() => {
          setCopiedInviteCode(null);
        }, 2000);
      })
      .catch((err) => {
        console.error('Failed to copy to clipboard:', err);
        // You could show an error message here
      });
  };

  /**
   * Format uses left display
   */
  const formatUsesLeft = (usesLeft, type) => {
    if (type === 'one-time') {
      return usesLeft > 0 ? 'Unclaimed' : 'Redeemed';
    }
    if (usesLeft === 'infinite') return '∞';
    return usesLeft.toString();
  };

  /**
   * Format creation date
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Fetch invitations when modal opens
  useEffect(() => {
    if (isOpen && event?.eventId) {
      fetchInvitations();
    }
  }, [isOpen, event?.eventId, sessionToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Manage Invitations - {event?.eventName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Success Toast */}
        {copiedInviteCode && (
          <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Success!</h3>
                <div className="mt-2 text-sm">
                  Invitation link copied to clipboard
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Error</h3>
                <div className="mt-2 text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Create Invitation Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create New Invitation'}
          </button>
        </div>

        {/* Create Invitation Form */}
        {showCreateForm && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Create New Invitation
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Invitation Type
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="generic">Generic (Unlimited uses)</option>
                  <option value="one-time">One-time (Single use)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="e.g., VIP invite, Early access, etc."
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvitation}
                  disabled={creating}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Invitation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invitations List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Existing Invitations
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No invitations created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.inviteCode}
                  className={`rounded-lg p-4 ${
                    invitation.type === 'one-time' && invitation.usesLeft === 0
                      ? 'bg-gray-600 border border-gray-500'
                      : 'bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-lg font-bold text-blue-400">
                          {invitation.inviteCode}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invitation.type === 'one-time'
                              ? invitation.usesLeft > 0
                                ? 'bg-orange-900 text-orange-300'
                                : 'bg-gray-800 text-gray-400'
                              : 'bg-green-900 text-green-300'
                          }`}
                        >
                          {invitation.type === 'one-time'
                            ? invitation.usesLeft > 0
                              ? 'One-time'
                              : 'Redeemed'
                            : 'Generic'}
                        </span>
                        {invitation.type !== 'one-time' && (
                          <span className="text-sm text-gray-400">
                            Uses:{' '}
                            {formatUsesLeft(
                              invitation.usesLeft,
                              invitation.type
                            )}
                          </span>
                        )}
                      </div>

                      {invitation.description && (
                        <p className="text-gray-300 text-sm mb-2">
                          {invitation.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Created: {formatDate(invitation.createdAt)}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(invitation.inviteCode)}
                        disabled={
                          invitation.type === 'one-time' &&
                          invitation.usesLeft === 0
                        }
                        className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                          invitation.type === 'one-time' &&
                          invitation.usesLeft === 0
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : copiedInviteCode === invitation.inviteCode
                            ? 'bg-green-600'
                            : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                        title={
                          invitation.type === 'one-time' &&
                          invitation.usesLeft === 0
                            ? 'Cannot copy redeemed one-time invitation'
                            : copiedInviteCode === invitation.inviteCode
                            ? 'Copied to clipboard!'
                            : 'Copy invitation link'
                        }
                      >
                        {copiedInviteCode === invitation.inviteCode
                          ? 'Copied!'
                          : 'Copy Link'}
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteInvitation(invitation.inviteCode)
                        }
                        disabled={
                          invitation.type === 'one-time' &&
                          invitation.usesLeft === 0
                        }
                        className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                          invitation.type === 'one-time' &&
                          invitation.usesLeft === 0
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-red-600 hover:bg-red-500'
                        }`}
                        title={
                          invitation.type === 'one-time' &&
                          invitation.usesLeft === 0
                            ? 'Cannot delete redeemed one-time invitation'
                            : 'Delete invitation'
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Make ManageInvitesModal available globally
window.ManageInvitesModal = ManageInvitesModal;
