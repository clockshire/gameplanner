/**
 * Invite Redemption Page Component
 * Handles invitation code redemption at /invite/{code}
 */

const { useState, useEffect } = React;

/**
 * InviteRedemptionPage component
 * Shows invitation details and handles redemption
 */
function InviteRedemptionPage({ inviteCode, onBack, onLoginWithRedirect }) {
  const { sessionToken, isAuthenticated } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Format date for display
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Format time for display
   * @param {string} time - Time string (HH:MM format)
   * @returns {string} Formatted time
   */
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  /**
   * Format event start and end with times for clear display
   * @param {Object} event - Event object
   * @returns {Object} Object with start and end formatted strings
   */
  const formatEventStartEnd = (event) => {
    try {
      const startDate = new Date(event.eventDate);
      const endDate = new Date(event.endDate || event.eventDate);

      const startFormatted = startDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const endFormatted = endDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const startTime = event.startTime ? formatTime(event.startTime) : '';
      const endTime = event.endTime ? formatTime(event.endTime) : '';

      const startText =
        'Event Start: ' +
        startFormatted +
        (startTime ? ' at ' + startTime : '');
      const endText =
        'Event End: ' + endFormatted + (endTime ? ' at ' + endTime : '');

      return {
        start: startText,
        end: endText,
        isMultiDay: startDate.toDateString() !== endDate.toDateString(),
      };
    } catch (error) {
      console.warn('Error formatting event dates:', error);
      const startText =
        'Event Start: ' +
        formatDate(event.eventDate) +
        (event.startTime ? ' at ' + formatTime(event.startTime) : '');
      const endText =
        'Event End: ' +
        formatDate(event.eventDate) +
        (event.endTime ? ' at ' + formatTime(event.endTime) : '');

      return {
        start: startText,
        end: endText,
        isMultiDay: false,
      };
    }
  };

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
        `http://localhost:3001/api/events/${eventId}/public`
      );

      const data = await response.json();

      if (data.success) {
        setEvent(data.data);
        // If event has a venue, fetch venue details
        if (data.data.venueId) {
          await fetchVenueDetails(data.data.venueId);
        }
        // If event has a creator, fetch creator details
        if (data.data.createdBy) {
          await fetchCreatorDetails(data.data.createdBy);
        }
      } else {
        console.warn('Failed to fetch event details:', data.message);
        setError('Failed to load event details');
      }
    } catch (err) {
      console.warn('Error fetching event details:', err);
      setError('Failed to load event details');
    }
  };

  /**
   * Fetch venue details
   */
  const fetchVenueDetails = async (venueId) => {
    try {
      const headers = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/venues/${venueId}/public`
      );

      const data = await response.json();

      if (data.success) {
        setVenue(data.data);
      } else {
        console.warn('Failed to fetch venue details:', data.message);
      }
    } catch (err) {
      console.warn('Error fetching venue details:', err);
    }
  };

  /**
   * Fetch creator details
   */
  const fetchCreatorDetails = async (creatorId) => {
    try {
      const headers = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/auth/users/${creatorId}`,
        { headers }
      );

      const data = await response.json();

      if (data.success) {
        setCreator(data.data);
      } else {
        console.warn('Failed to fetch creator details:', data.message);
      }
    } catch (err) {
      console.warn('Error fetching creator details:', err);
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

  // Check if invitation is redeemed (one-time invitation with no uses left)
  const isRedeemed =
    invitation && invitation.type === 'one-time' && invitation.usesLeft === 0;

  if (isRedeemed) {
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Event Header */}
          {event && (
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                {event.eventName}
              </h1>
              <p className="text-xl text-gray-300">
                This invitation has already been redeemed
              </p>
            </div>
          )}

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
                  <div className="font-mono text-lg text-blue-400">
                    {invitation?.inviteCode}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Type
                  </label>
                  <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-orange-900 text-orange-300">
                    One-time Use
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Status
                  </label>
                  <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-red-900 text-red-300">
                    Redeemed
                  </span>
                </div>

                {venue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Venue
                    </label>
                    <div className="text-white">{venue.venueName}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Redeemed Message */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-center">
                <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Invitation Already Redeemed
                </h3>
                <p className="text-gray-400">
                  This invitation has already been used and cannot be redeemed
                  again.
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        {event && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {event.eventName}
            </h1>
            <p className="text-xl text-gray-300">
              You've been invited to join this event!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
              <div className="space-y-6">
                {/* Event Description */}
                {event.description && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg
                        className="h-5 w-5 text-blue-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-400">
                        Event Description
                      </span>
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Event Date and Time */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg
                      className="h-5 w-5 text-blue-400 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-400">
                      Event Schedule
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const eventTimes = formatEventStartEnd(event);
                      return (
                        <>
                          <div className="text-white text-lg">
                            {eventTimes.start}
                          </div>
                          {eventTimes.isMultiDay && (
                            <div className="text-white text-lg">
                              {eventTimes.end}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Venue Information */}
                {venue ? (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <svg
                        className="h-5 w-5 text-green-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-400">
                        Venue
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {venue.venueName}
                      </h4>
                      {venue.address && (
                        <p className="text-gray-300 mb-2">{venue.address}</p>
                      )}
                      {venue.description && (
                        <p className="text-gray-400 text-sm mb-2">
                          {venue.description}
                        </p>
                      )}
                      {venue.capacity && (
                        <p className="text-sm text-gray-400">
                          Capacity: {venue.capacity} people (calculated from
                          rooms)
                        </p>
                      )}
                      {venue.contactPhone && (
                        <p className="text-sm text-gray-400">
                          Phone: {venue.contactPhone}
                        </p>
                      )}
                      {venue.contactEmail && (
                        <p className="text-sm text-gray-400">
                          Email: {venue.contactEmail}
                        </p>
                      )}
                    </div>
                  </div>
                ) : event.venueId ? (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg
                        className="h-5 w-5 text-yellow-400 mr-2"
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
                      <span className="text-sm font-medium text-gray-400">
                        Venue
                      </span>
                    </div>
                    <div className="text-yellow-300">
                      Venue details will be available after joining
                    </div>
                  </div>
                ) : null}

                {/* Event Creator */}
                {creator && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg
                        className="h-5 w-5 text-purple-400 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-400">
                        Event Organizer
                      </span>
                    </div>
                    <div className="text-white">
                      {creator.name || creator.email || 'Unknown Organizer'}
                    </div>
                  </div>
                )}

                {/* Event Status */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-gray-400">
                        Event Status
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <div className="text-gray-400">Loading event details...</div>
              </div>
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
                  if (onLoginWithRedirect) {
                    onLoginWithRedirect(`#invite/${inviteCode}`);
                  } else {
                    window.location.hash = '#login';
                  }
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
