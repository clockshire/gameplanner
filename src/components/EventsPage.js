/**
 * Events Page Component
 * Displays a list of all events
 */

const { useState, useEffect } = React;

/**
 * EventsPage component
 * Shows all events with proper formatting and empty state
 */
function EventsPage({ onViewEventDetails, currentUser }) {
  const { sessionToken, loading: authLoading, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  /**
   * Fetch events from the API
   */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Don't fetch if not authenticated
      if (!isAuthenticated || !sessionToken) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${sessionToken}`,
      };

      const response = await fetch('http://localhost:3001/api/events', {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        setEvents(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle event creation
   */
  const handleEventCreated = () => {
    // Refresh the events list
    fetchEvents();
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

  // Fetch events when authentication state changes
  useEffect(() => {
    if (!authLoading) {
      fetchEvents();
    }
  }, [authLoading, isAuthenticated, sessionToken]);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Events</h1>
              <p className="text-gray-400">
                View and manage all upcoming and past events
              </p>
            </div>
            {!loading && !error && events.length > 0 && (
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors"
                >
                  Create Event
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {(authLoading || loading) && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">
              {authLoading ? 'Loading...' : 'Loading events...'}
            </span>
          </div>
        )}

        {/* Error State */}
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
                <h3 className="text-sm font-medium">Error loading events</h3>
                <div className="mt-2 text-sm">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={fetchEvents}
                    className="bg-red-800 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!authLoading && !loading && !error && events.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No Current Events
            </h3>
            <p className="text-gray-400 mb-6">
              There are no events scheduled at the moment. Create your first
              event or check back later!
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors"
              >
                Create Event
              </button>
              <button
                onClick={fetchEvents}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Events List */}
        {!authLoading && !loading && !error && events.length > 0 && (
          <div>
            {/* Active Events */}
            {events.filter((event) => event.status !== 'completed').length >
              0 && (
              <div className="space-y-6">
                {events
                  .filter((event) => event.status !== 'completed')
                  .map((event) => (
                    <div
                      key={event.eventId}
                      className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-white">
                              {event.eventName}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClasses(
                                event.status
                              )}`}
                            >
                              {event.status}
                            </span>
                            {/* Your Event label - only show if current user created this event */}
                            {currentUser &&
                              event.createdBy === currentUser.userId && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white border border-red-700">
                                  Your Event
                                </span>
                              )}
                          </div>

                          {event.description && (
                            <p className="text-gray-300 mb-3">
                              {event.description}
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                            <div className="flex items-center text-gray-400">
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
                              <span>
                                {formatDateRange(
                                  event.eventDate,
                                  event.endDate || event.eventDate
                                )}
                              </span>
                            </div>

                            {(event.startTime || event.endTime) && (
                              <div className="flex items-center text-gray-400">
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
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>
                                  {event.startTime &&
                                    formatTime(event.startTime)}
                                  {event.startTime && event.endTime && ' - '}
                                  {event.endTime && formatTime(event.endTime)}
                                </span>
                              </div>
                            )}

                            {event.maxParticipants > 0 && (
                              <div className="flex items-center text-gray-400">
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
                                  {event.maxParticipants} participants
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:ml-6">
                          <button
                            onClick={() => onViewEventDetails(event.eventId)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Dividing Line and Past Events Section */}
            {events.filter((event) => event.status === 'completed').length >
              0 && (
              <>
                {/* Dividing Line */}
                <div className="my-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gray-900 text-gray-400 font-medium">
                        Past Events
                      </span>
                    </div>
                  </div>
                </div>

                {/* Past Events */}
                <div className="space-y-6">
                  {events
                    .filter((event) => event.status === 'completed')
                    .map((event) => (
                      <div
                        key={event.eventId}
                        className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors opacity-75"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-white">
                                {event.eventName}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusBadgeClasses(
                                  event.status
                                )}`}
                              >
                                {event.status}
                              </span>
                              {/* Your Event label - only show if current user created this event */}
                              {currentUser &&
                                event.createdBy === currentUser.userId && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white border border-red-700">
                                    Your Event
                                  </span>
                                )}
                            </div>

                            {event.description && (
                              <p className="text-gray-300 mb-3">
                                {event.description}
                              </p>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                              <div className="flex items-center text-gray-400">
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
                                <span>
                                  {formatDateRange(
                                    event.eventDate,
                                    event.endDate || event.eventDate
                                  )}
                                </span>
                              </div>

                              {(event.startTime || event.endTime) && (
                                <div className="flex items-center text-gray-400">
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
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>
                                    {event.startTime &&
                                      formatTime(event.startTime)}
                                    {event.startTime && event.endTime && ' - '}
                                    {event.endTime && formatTime(event.endTime)}
                                  </span>
                                </div>
                              )}

                              {event.maxParticipants > 0 && (
                                <div className="flex items-center text-gray-400">
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
                                    {event.maxParticipants} participants
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 sm:mt-0 sm:ml-6">
                            <button
                              onClick={() => onViewEventDetails(event.eventId)}
                              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Create Event Modal */}
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onEventCreated={handleEventCreated}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}

// Make EventsPage available globally
window.EventsPage = EventsPage;
