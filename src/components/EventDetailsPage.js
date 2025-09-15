/**
 * Event Details Page Component
 * Displays detailed information about a specific event
 */

const { useState, useEffect } = React;

/**
 * EventDetailsPage component
 * Shows detailed event information with venue details
 */
function EventDetailsPage({
  eventId,
  onBack,
  currentUser,
  onEditEvent,
  onDeleteEvent,
  onManageRooms,
  onManageInvites,
}) {
  const { sessionToken } = useAuth();
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [creator, setCreator] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [eventRooms, setEventRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch event details from the API
   */
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

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
        // If event has a venue, fetch venue details
        if (data.data.venueId) {
          await fetchVenueDetails(data.data.venueId);
        }
        // If event has a creator, fetch creator details
        if (data.data.createdBy) {
          await fetchCreatorDetails(data.data.createdBy);
        }
        // Fetch event-specific room assignments
        await fetchEventRooms(data.data.eventId);
      } else {
        setError(data.message || 'Failed to fetch event details');
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch venue details from the API
   * @param {string} venueId - Venue ID
   */
  const fetchVenueDetails = async (venueId) => {
    try {
      const headers = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/venues/${venueId}`,
        { headers }
      );
      const data = await response.json();

      if (data.success) {
        setVenue(data.data);
        // Also fetch rooms for this venue
        await fetchVenueRooms(venueId);
      } else {
        console.warn('Failed to fetch venue details:', data.message);
      }
    } catch (err) {
      console.warn('Error fetching venue details:', err);
    }
  };

  /**
   * Fetch rooms for a venue
   * @param {string} venueId - Venue ID
   */
  const fetchVenueRooms = async (venueId) => {
    try {
      const headers = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/rooms/venue/${venueId}`,
        { headers }
      );
      const data = await response.json();

      if (data.success) {
        setRooms(data.data || []);
      } else {
        console.warn('Failed to fetch venue rooms:', data.message);
        setRooms([]);
      }
    } catch (err) {
      console.warn('Error fetching venue rooms:', err);
      setRooms([]);
    }
  };

  /**
   * Fetch creator details from the API
   * @param {string} creatorId - Creator user ID
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
   * Fetch event-specific room assignments
   * @param {string} eventId - Event ID
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
        setEventRooms(data.data || []);
      } else {
        console.warn('Failed to fetch event rooms:', data.message);
        setEventRooms([]);
      }
    } catch (err) {
      console.warn('Error fetching event rooms:', err);
      setEventRooms([]);
    }
  };

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Format date range for display
   * @param {string} startDate - Start date ISO string
   * @param {string} endDate - End date ISO string
   * @returns {string} Formatted date range
   */
  const formatDateRange = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // If same date, show single date
      if (start.toDateString() === end.toDateString()) {
        return formatDate(startDate);
      }

      // If different dates, show range
      const startFormatted = start.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });

      const endFormatted = end.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      return `${startFormatted} - ${endFormatted}`;
    } catch (error) {
      return formatDate(startDate);
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
   * Format time for display
   * @param {string} timeString - Time string
   * @returns {string} Formatted time
   */
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      // If it's already in HH:MM format, return as is
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      // If it's a full datetime, extract time
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return timeString;
    }
  };

  /**
   * Get status badge styling
   * @param {string} status - Event status
   * @returns {string} CSS classes
   */
  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-gray-700 text-gray-200 border-gray-600';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Fetch event details on component mount
  useEffect(() => {
    if (eventId && sessionToken) {
      fetchEventDetails();
    }
  }, [eventId, sessionToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h3 className="text-sm font-medium">Error loading event</h3>
                <div className="mt-2 text-sm">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={fetchEventDetails}
                    className="bg-red-800 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-white mb-2">
              Event Not Found
            </h3>
            <p className="text-gray-400 mb-6">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={onBack}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-4">
                <button
                  onClick={onBack}
                  className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
                >
                  <svg
                    className="h-5 w-5 mr-2"
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
                  Back to Events
                </button>

                {/* Action Buttons or Completed Message */}
                {currentUser && event.createdBy === currentUser.userId && (
                  <>
                    {event.status !== 'completed' ? (
                      <div className="flex space-x-3">
                        {onEditEvent && (
                          <button
                            onClick={() => onEditEvent(event)}
                            className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                          >
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit Event
                          </button>
                        )}
                        {onManageRooms && (
                          <button
                            onClick={() => onManageRooms(event)}
                            className="flex items-center bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
                          >
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
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            Manage Rooms
                          </button>
                        )}
                        {onManageInvites && (
                          <button
                            onClick={() => onManageInvites(event)}
                            className="flex items-center bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
                          >
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
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                              />
                            </svg>
                            Manage Invites
                          </button>
                        )}
                        {onDeleteEvent && (
                          <button
                            onClick={() => onDeleteEvent(event)}
                            className="flex items-center bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
                          >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete Event
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center text-gray-300">
                          <svg
                            className="h-5 w-5 mr-2 text-gray-400"
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
                          <span>
                            This event is completed and can no longer be
                            modified.
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">
                {event.eventName}
              </h1>
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium border ${getStatusBadgeClasses(
                    event.status
                  )}`}
                >
                  {event.status}
                </span>
                <span className="text-gray-400 text-sm">
                  Created {new Date(event.createdAt).toLocaleDateString()}
                </span>
              </div>
              {creator && (
                <div className="mt-2">
                  <span className="text-gray-400 text-sm">
                    Created by:{' '}
                    <span className="text-white font-medium">
                      {creator.name}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Event Information */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Event Information
              </h2>

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
                      {event.currentParticipants || 0} /{' '}
                      {event.maxParticipants || '∞'} participants
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Rooms Section */}
            {eventRooms.length > 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Assigned Rooms & Availability
                </h2>
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
                                        const dayName = date.toLocaleDateString(
                                          'en-GB',
                                          { weekday: 'long' }
                                        );
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
              </div>
            )}
          </div>

          {/* Venue Information */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Venue Information
              </h2>

              {venue ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Venue Name
                    </h3>
                    <p className="text-white font-medium">{venue.venueName}</p>
                  </div>

                  {venue.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">
                        Description
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {venue.description}
                      </p>
                    </div>
                  )}

                  {venue.address && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">
                        Address
                      </h3>
                      <div className="flex items-start">
                        <svg
                          className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {venue.mapLink ? (
                          <a
                            href={venue.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm break-words underline"
                          >
                            {venue.address}
                          </a>
                        ) : (
                          <span className="text-gray-300 text-sm break-words">
                            {venue.address}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {(venue.contactPhone ||
                    venue.contactEmail ||
                    venue.websiteURL) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">
                        Contact
                      </h3>
                      <div className="space-y-2">
                        {venue.contactPhone && (
                          <div className="flex items-start">
                            <svg
                              className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            <a
                              href={`tel:${venue.contactPhone}`}
                              className="text-blue-400 hover:text-blue-300 text-sm break-words underline"
                            >
                              {venue.contactPhone}
                            </a>
                          </div>
                        )}
                        {venue.contactEmail && (
                          <div className="flex items-start">
                            <svg
                              className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <a
                              href={`mailto:${venue.contactEmail}`}
                              className="text-blue-400 hover:text-blue-300 text-sm break-words underline"
                            >
                              {venue.contactEmail}
                            </a>
                          </div>
                        )}
                        {venue.websiteURL && (
                          <div className="flex items-start">
                            <svg
                              className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            <a
                              href={venue.websiteURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm break-words underline"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {venue.capacity > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">
                        Capacity
                      </h3>
                      <div className="flex items-center">
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
                        <span className="text-gray-300 text-sm">
                          {venue.capacity} people
                        </span>
                      </div>
                    </div>
                  )}
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
          </div>
        </div>
      </div>
    </div>
  );
}

// Make EventDetailsPage available globally
window.EventDetailsPage = EventDetailsPage;
