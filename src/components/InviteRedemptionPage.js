/**
 * Invite Redemption Page Component
 * Handles invitation code redemption at /invite/{code}
 */

const { useState, useEffect } = React;

/**
 * InviteRedemptionPage component
 * Shows invitation details and handles redemption
 */
function InviteRedemptionPage({ inviteCode, onBack }) {
  const { sessionToken, isAuthenticated, user } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Fetch invitation details
   */
  const fetchInvitationDetails = async () => {
    if (!inviteCode) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3001/api/invitations/${inviteCode}`
      );

      const data = await response.json();

      if (data.success) {
        setInvitation(data.data);
        // Fetch event details
        await fetchEventDetails(data.data.invitedEventId);
      } else {
        setError(data.message || 'Invalid invitation code');
      }
    } catch (err) {
      console.error('Error fetching invitation details:', err);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch event details
   */
  const fetchEventDetails = async (eventId) => {
    try {
      const headers = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/events/${eventId}`,
        { headers }
      );

      const data = await response.json();

      if (data.success) {
        setEvent(data.data);
      } else {
        console.warn('Failed to fetch event details:', data.message);
      }
    } catch (err) {
      console.warn('Error fetching event details:', err);
    }
  };

  /**
   * Handle invitation redemption
   */
  const handleRedeemInvitation = async () => {
    if (!sessionToken || !isAuthenticated) {
      setError('You must be logged in to redeem an invitation');
      return;
    }

    try {
      setRedeeming(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3001/api/invitations/${inviteCode}/redeem`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Redirect to event details after a short delay
        setTimeout(() => {
          window.location.hash = `#event-details/${data.data.eventId}`;
        }, 2000);
      } else {
        setError(data.message || 'Failed to redeem invitation');
      }
    } catch (err) {
      console.error('Error redeeming invitation:', err);
      setError('Failed to redeem invitation');
    } finally {
      setRedeeming(false);
    }
  };

  // Fetch invitation details when component mounts
  useEffect(() => {
    if (inviteCode) {
      fetchInvitationDetails();
    }
  }, [inviteCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-900 border border-red-700 text-red-100 px-6 py-4 rounded-lg mb-6">
            <div className="flex items-center">
              <svg
                className="h-8 w-8 text-red-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium">Invalid Invitation</h3>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-900 border border-green-700 text-green-100 px-6 py-4 rounded-lg mb-6">
            <div className="flex items-center">
              <svg
                className="h-8 w-8 text-green-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium">Invitation Redeemed!</h3>
                <p className="mt-1 text-sm">
                  You have successfully joined the event. Redirecting...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mr-4 text-gray-400 hover:text-white transition-colors"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <h1 className="text-2xl font-bold text-white">
                Event Invitation
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invitation Details */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Invitation Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Invitation Code
                </label>
                <div className="font-mono text-lg font-bold text-blue-400">
                  {invitation?.inviteCode}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Type
                </label>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    invitation?.type === 'one-time'
                      ? 'bg-orange-900 text-orange-300'
                      : 'bg-green-900 text-green-300'
                  }`}
                >
                  {invitation?.type === 'one-time'
                    ? 'One-time Use'
                    : 'Unlimited Uses'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Uses Remaining
                </label>
                <div className="text-white">
                  {invitation?.usesLeft === 'infinite'
                    ? '∞'
                    : invitation?.usesLeft}
                </div>
              </div>

              {invitation?.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <div className="text-white">{invitation.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Event Information
            </h2>

            {event ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {event.eventName}
                  </h3>
                  {event.description && (
                    <p className="text-gray-300 mt-2">{event.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Event Date
                  </label>
                  <div className="text-white">
                    {event.eventDate
                      ? new Date(event.eventDate).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'TBD'}
                  </div>
                </div>

                {event.venueId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Venue
                    </label>
                    <div className="text-white">
                      Venue details will be shown after joining
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400">Event details not available</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center">
          {!isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-gray-400">
                You need to be logged in to redeem this invitation
              </p>
              <button
                onClick={() => {
                  window.location.hash = '#login';
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Log In
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleRedeemInvitation}
                disabled={redeeming}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {redeeming ? 'Redeeming...' : 'Join Event'}
              </button>

              {error && <div className="text-red-400 text-sm">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Make InviteRedemptionPage available globally
window.InviteRedemptionPage = InviteRedemptionPage;
