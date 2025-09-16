/**
 * Event Details Page Component
 * Displays detailed information about a specific event with tabbed layout
 */

const { useState, useEffect } = React;

/**
 * EventDetailsPage component
 * Shows detailed event information with venue details in a tabbed interface
 */
function EventDetailsPage({
  eventId,
  onBack,
  currentUser,
  onEditEvent,
  onDeleteEvent,
  onManageRooms,
  onManageInvites,
  initialTab = 'event',
}) {
  const { sessionToken } = useAuth();
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [creator, setCreator] = useState(null);
  const [eventRooms, setEventRooms] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  /**
   * Get tab from URL hash or default to 'event'
   */
  const getTabFromHash = () => {
    const hash = window.location.hash;
    console.log('getTabFromHash - Full hash:', hash);

    // Handle both #tab= and %23tab= (URL encoded)
    let tab = null;
    if (hash.includes('#tab=')) {
      tab = hash.split('#tab=')[1];
    } else if (hash.includes('%23tab=')) {
      tab = hash.split('%23tab=')[1];
    }

    console.log('getTabFromHash - Extracted tab:', tab);
    if (tab && ['event', 'rooms', 'invites', 'attendees'].includes(tab)) {
      console.log('getTabFromHash - Valid tab found:', tab);
      return tab;
    }

    console.log('getTabFromHash - No valid tab found, defaulting to event');
    return 'event';
  };

  /**
   * Update URL hash with current tab
   */
  const updateUrlHash = (tab) => {
    const currentHash = window.location.hash;
    const baseHash = currentHash.split('#tab=')[0];
    const newHash = `${baseHash}#tab=${tab}`;
    window.history.replaceState(null, '', newHash);
  };

  /**
   * Handle tab change and update URL
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    updateUrlHash(tab);
  };

  /**
   * Fetch participants for the event
   */
  const fetchParticipants = async (eventIdToFetch = eventId) => {
    if (!eventIdToFetch) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/event-participants/event/${eventIdToFetch}/public`
      );

      const data = await response.json();

      if (data.success) {
        const participantsData = data.data || [];
        setParticipants(participantsData);
        setParticipantCount(participantsData.length);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  /**
   * Fetch invitations for the event
   */
  const fetchInvitations = async (eventIdToFetch = eventId) => {
    // Clean the eventId to remove any tab hash
    const cleanEventId = eventIdToFetch
      ? eventIdToFetch.split('#')[0]
      : eventId?.split('#')[0];
    console.log(
      'fetchInvitations - cleanEventId:',
      cleanEventId,
      'sessionToken:',
      !!sessionToken
    );
    if (!cleanEventId || !sessionToken) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/invitations/event/${cleanEventId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log('fetchInvitations - API returned data:', data.data);
        setInvitations(data.data || []);
      } else {
        console.warn('fetchInvitations - API returned error:', data.message);
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  /**
   * Fetch event details from the API
   */
  const fetchEventDetails = async (eventIdToFetch = eventId) => {
    if (!eventIdToFetch) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3001/api/events/${eventIdToFetch}/public`
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
          console.log('Fetching creator details for:', data.data.createdBy);
          await fetchCreatorDetails(data.data.createdBy);
        } else {
          console.log('No creator ID found in event data');
        }
        // Event rooms will be fetched when currentUser becomes available
      } else {
        setError(data.message || 'Failed to load event details');
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
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

      // Use public endpoint for participants, authenticated endpoint for owners
      const isOwner =
        event && currentUser && event.createdBy === currentUser.userId;
      const endpoint = isOwner
        ? `http://localhost:3001/api/venues/${venueId}`
        : `http://localhost:3001/api/venues/${venueId}/public`;

      const response = await fetch(endpoint, { headers });

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
        console.log('Fetched creator details:', data.data);
      } else {
        console.warn('Failed to fetch creator details:', data.message);
      }
    } catch (err) {
      console.warn('Error fetching creator details:', err);
    }
  };

  /**
   * Fetch event rooms
   */
  const fetchEventRooms = async (eventId) => {
    try {
      const headers = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/events/${eventId}/rooms`,
        { headers }
      );

      const data = await response.json();

      if (data.success) {
        console.log('API returned rooms data:', data.data);
        console.log('Number of rooms:', data.data?.length || 0);
        setEventRooms(data.data || []);
        console.log('Set eventRooms state to:', data.data);
      } else {
        console.warn('Failed to fetch event rooms:', data.message);
      }
    } catch (err) {
      console.warn('Error fetching event rooms:', err);
    }
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

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    if (eventId) {
      // Clean eventId to remove any tab hash
      const cleanEventId = eventId.split('#')[0];
      console.log(
        'EventDetailsPage: Fetching event details for eventId:',
        cleanEventId
      );
      console.log('EventDetailsPage: Current user:', currentUser);

      // Always fetch event details (public endpoint)
      fetchEventDetails(cleanEventId);
      fetchParticipants(cleanEventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (
      eventId &&
      currentUser &&
      event &&
      event.createdBy === currentUser.userId &&
      sessionToken
    ) {
      const cleanEventId = eventId.split('#')[0];
      console.log(
        'useEffect - fetching invitations for cleanEventId:',
        cleanEventId,
        'sessionToken:',
        !!sessionToken
      );
      fetchInvitations(cleanEventId);
    }
  }, [eventId, currentUser, event, sessionToken]);

  // Fetch event rooms when currentUser becomes available and user is the creator
  useEffect(() => {
    if (
      eventId &&
      currentUser &&
      event &&
      event.createdBy === currentUser.userId
    ) {
      const cleanEventId = eventId.split('#')[0];
      console.log(
        'Current user now available, fetching event rooms for event:',
        cleanEventId
      );
      fetchEventRooms(cleanEventId);
    }
  }, [eventId, currentUser, event]);

  // Set initial tab from prop on component mount
  useEffect(() => {
    console.log('Setting initial tab from prop to:', initialTab);
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handle browser back/forward navigation for tabs
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading event details...</p>
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
                <h3 className="text-lg font-medium">Error</h3>
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Event not found</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          )}
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
              <h1 className="text-2xl font-bold text-white">Event Details</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {event.eventName}
          </h1>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                event.status === 'active'
                  ? 'bg-green-900 text-green-300'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {event.status}
            </span>
            <span className="text-gray-400 text-sm">
              Created by {creator?.name || event.creatorName || 'Unknown'} on{' '}
              {new Date(event.createdAt).toLocaleDateString('en-GB')}
            </span>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            {console.log('Rendering tab navigation - activeTab:', activeTab)}
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('event')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'event'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Event
              </button>
              {currentUser && event.createdBy === currentUser.userId && (
                <button
                  onClick={() => handleTabChange('rooms')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'rooms'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Rooms
                </button>
              )}
              {currentUser && event.createdBy === currentUser.userId && (
                <button
                  onClick={() => handleTabChange('invites')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'invites'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Invites
                </button>
              )}
              <button
                onClick={() => handleTabChange('attendees')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendees'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Attendees
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'event' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Event Information */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white">
                        Event Information
                      </h2>
                      {currentUser &&
                        event.createdBy === currentUser.userId && (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => onEditEvent(event)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                            >
                              Edit Event
                            </button>
                            <button
                              onClick={() => onDeleteEvent(event)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm"
                            >
                              Delete Event
                            </button>
                          </div>
                        )}
                    </div>

                    {event.description && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                          Description
                        </h3>
                        <p className="text-gray-300">{event.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                          Event Schedule
                        </h3>
                        <div className="space-y-2">
                          {(() => {
                            const eventTimes = formatEventStartEnd(event);
                            return (
                              <>
                                <div className="flex items-center text-gray-300">
                                  <svg
                                    className="h-4 w-4 mr-2"
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
                                  <span>{eventTimes.start}</span>
                                </div>
                                {eventTimes.isMultiDay && (
                                  <div className="flex items-center text-gray-300">
                                    <svg
                                      className="h-4 w-4 mr-2"
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
                                    <span>{eventTimes.end}</span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                          Participants
                        </h3>
                        <div className="flex items-center text-gray-300">
                          <svg
                            className="h-4 w-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span>
                            {participantCount} / {event.maxParticipants || '∞'}{' '}
                            participants
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Venue Information */}
                  {venue ? (
                    <div className="bg-gray-700 rounded-lg p-6">
                      <h2 className="text-xl font-semibold text-white mb-4">
                        Venue Information
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {venue.venueName}
                          </h3>
                          {venue.description && (
                            <p className="text-gray-300 mb-4">
                              {venue.description}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {venue.address && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">
                                Address
                              </h4>
                              <p className="text-gray-300">{venue.address}</p>
                            </div>
                          )}

                          {venue.contactPhone && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">
                                Phone
                              </h4>
                              <p className="text-gray-300">
                                {venue.contactPhone}
                              </p>
                            </div>
                          )}

                          {venue.websiteURL && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">
                                Website
                              </h4>
                              <a
                                href={venue.websiteURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-1">
                              Capacity
                            </h4>
                            <p className="text-gray-300">
                              {venue.capacity} people (calculated from rooms)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-2">
                        <svg
                          className="h-12 w-12 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {event.venueId
                          ? 'Venue details not available'
                          : 'No venue assigned'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Sidebar - Empty for event tab */}
                <div className="lg:col-span-1"></div>
              </div>
            )}

            {activeTab === 'rooms' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Assigned Rooms & Availability
                  </h2>
                  {currentUser && event.createdBy === currentUser.userId && (
                    <button
                      onClick={() => onManageRooms(event)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm"
                    >
                      Manage Rooms
                    </button>
                  )}
                </div>
                {console.log(
                  'Rendering rooms tab - eventRooms:',
                  eventRooms,
                  'length:',
                  eventRooms.length,
                  'activeTab:',
                  activeTab
                )}
                {eventRooms.length > 0 ? (
                  <div className="space-y-4">
                    {eventRooms.map((room) => (
                      <div
                        key={room.roomId}
                        className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-medium text-white">
                                {room.roomName}
                              </h3>
                              {room.capacity && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200 border border-blue-700">
                                  {room.capacity} 👥
                                </span>
                              )}
                            </div>

                            {room.description && (
                              <p className="text-gray-300 text-sm mb-3">
                                {room.description}
                              </p>
                            )}

                            {/* Available Times */}
                            {room.availableTimes &&
                              room.availableTimes.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                                    Available Times:
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {room.availableTimes.map((time, index) => {
                                      // Format the date for display
                                      const formatDateForDisplay = (
                                        dateString
                                      ) => {
                                        try {
                                          const date = new Date(dateString);
                                          const dayName =
                                            date.toLocaleDateString('en-GB', {
                                              weekday: 'long',
                                            });
                                          const dayNumber = date.getDate();
                                          const monthName =
                                            date.toLocaleDateString('en-GB', {
                                              month: 'short',
                                            });
                                          const year = date.getFullYear();

                                          const getOrdinalSuffix = (day) => {
                                            if (day >= 11 && day <= 13)
                                              return 'th';
                                            switch (day % 10) {
                                              case 1:
                                                return 'st';
                                              case 2:
                                                return 'nd';
                                              case 3:
                                                return 'rd';
                                              default:
                                                return 'th';
                                            }
                                          };

                                          return `${dayName}, ${dayNumber}${getOrdinalSuffix(
                                            dayNumber
                                          )} ${monthName} ${year}`;
                                        } catch (error) {
                                          // Fallback to original format if date parsing fails
                                          return (
                                            time.dayOfWeek
                                              .charAt(0)
                                              .toUpperCase() +
                                            time.dayOfWeek.slice(1)
                                          );
                                        }
                                      };

                                      return (
                                        <span
                                          key={index}
                                          className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium bg-green-900 text-green-200 border border-green-700"
                                        >
                                          {formatDateForDisplay(time.dayOfWeek)}{' '}
                                          {time.startTime}-{time.endTime}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">
                      <svg
                        className="h-12 w-12 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">
                      No rooms assigned to this event yet
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invites' && (
              <div className="space-y-6">
                {/* Invitation Summary */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">
                      Invitation Summary
                    </h2>
                    {currentUser && event.createdBy === currentUser.userId && (
                      <button
                        onClick={() => onManageInvites(event)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
                      >
                        Manage Invites
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {invitations.length}
                      </div>
                      <div className="text-sm text-gray-400">
                        Total Invitations
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {invitations.filter((inv) => inv.usesLeft === 0).length}
                      </div>
                      <div className="text-sm text-gray-400">Redeemed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-400">
                        {invitations.filter((inv) => inv.usesLeft > 0).length}
                      </div>
                      <div className="text-sm text-gray-400">Unclaimed</div>
                    </div>
                  </div>
                </div>

                {/* Recent Invitations */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Recent Invitations
                  </h3>
                  <div className="space-y-2">
                    {invitations
                      .sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                      )
                      .slice(0, 5)
                      .map((invitation) => (
                        <div
                          key={invitation.inviteCode}
                          className="flex items-center justify-between bg-gray-600 rounded-lg p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm text-blue-400">
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
                            {invitation.description && (
                              <span className="text-sm text-gray-400">
                                {invitation.description}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(invitation.createdAt).toLocaleDateString(
                              'en-GB'
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendees' && (
              <div className="space-y-6">
                {/* Attendees Summary */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Event Attendees
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {participants.length}
                      </div>
                      <div className="text-sm text-gray-400">
                        Total Attendees
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {event?.maxParticipants || '∞'}
                      </div>
                      <div className="text-sm text-gray-400">Max Capacity</div>
                    </div>
                  </div>
                </div>

                {/* Attendees List */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Attendee List
                  </h3>
                  {participants.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No attendees yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {participants
                        .sort(
                          (a, b) => new Date(a.joinedAt) - new Date(b.joinedAt)
                        )
                        .map((participant, index) => (
                          <div
                            key={participant.userId}
                            className="flex items-center justify-between bg-gray-600 rounded-lg p-4"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {participant.userName
                                      ?.charAt(0)
                                      ?.toUpperCase() || '?'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="text-white font-medium">
                                  {participant.userName || 'Unknown User'}
                                </div>
                                <div className="text-gray-400 text-sm">
                                  {participant.userEmail}
                                </div>
                                {participant.inviteCode && (
                                  <div className="text-gray-500 text-xs">
                                    Joined via: {participant.inviteCode}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-400 text-sm">
                                Joined{' '}
                                {new Date(
                                  participant.joinedAt
                                ).toLocaleDateString('en-GB')}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {new Date(
                                  participant.joinedAt
                                ).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Make EventDetailsPage available globally
window.EventDetailsPage = EventDetailsPage;
