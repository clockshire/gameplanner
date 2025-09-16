const { useState, useEffect } = React;

// Main App component
function App() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [editVenueId, setEditVenueId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [managingRoomsEvent, setManagingRoomsEvent] = useState(null);
  const [showManageRoomsModal, setShowManageRoomsModal] = useState(false);
  const [managingInvitesEvent, setManagingInvitesEvent] = useState(null);
  const [showManageInvitesModal, setShowManageInvitesModal] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(null);
  const [currentTab, setCurrentTab] = useState('event');

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
  };

  /**
   * Handle successful authentication
   */
  const handleAuthSuccess = () => {
    setShowAuthModal(false);

    // If there's a redirect URL, navigate to it
    if (redirectAfterAuth) {
      window.location.hash = redirectAfterAuth;
      setRedirectAfterAuth(null);
    }
  };

  /**
   * Handle login with redirect
   */
  const handleLoginWithRedirect = (redirectUrl) => {
    // Store redirect URL in the hash as a parameter
    window.location.hash = `#login?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  /**
   * Handle navigation
   */
  const handleNavigation = (page) => {
    setCurrentPage(page);
    setEditVenueId(null); // Clear edit venue when navigating
    setSelectedEventId(null); // Clear selected event when navigating
  };

  /**
   * Handle edit venue
   */
  const handleEditVenue = (venueId) => {
    setEditVenueId(venueId);
    setCurrentPage('edit-venue');
  };

  /**
   * Handle back from edit venue
   */
  const handleBackFromEditVenue = () => {
    setEditVenueId(null);
    setCurrentPage('venues');
  };

  /**
   * Handle venue updated
   */
  const handleVenueUpdated = () => {
    // This will be passed to VenuesPage to refresh the list
  };

  /**
   * Handle view event details
   */
  const handleViewEventDetails = (eventId) => {
    setSelectedEventId(eventId);
    setCurrentPage(`event-details/${eventId}`);
  };

  /**
   * Handle back from event details
   */
  const handleBackFromEventDetails = () => {
    setSelectedEventId(null);
    setCurrentPage('events');
  };

  /**
   * Handle edit event
   */
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEditEventModal(true);
  };

  /**
   * Handle close edit event modal
   */
  const handleCloseEditEventModal = () => {
    setEditingEvent(null);
    setShowEditEventModal(false);
  };

  /**
   * Handle event updated
   */
  const handleEventUpdated = (updatedEvent) => {
    // Close the modal
    handleCloseEditEventModal();
    // Refresh the event details if we're viewing the same event
    if (selectedEventId === updatedEvent.eventId) {
      // The EventDetailsPage will refresh when it re-renders
      window.location.reload();
    }
  };

  /**
   * Handle delete event
   */
  const handleDeleteEvent = (event) => {
    setDeletingEvent(event);
    setShowDeleteEventModal(true);
  };

  /**
   * Handle close delete event modal
   */
  const handleCloseDeleteEventModal = () => {
    setDeletingEvent(null);
    setShowDeleteEventModal(false);
  };

  /**
   * Handle event deleted
   */
  const handleEventDeleted = (deletedEvent) => {
    // Close the modal
    handleCloseDeleteEventModal();
    // Navigate back to events list
    setSelectedEventId(null);
    setCurrentPage('events');
  };

  /**
   * Handle manage rooms
   */
  const handleManageRooms = (event) => {
    setManagingRoomsEvent(event);
    setShowManageRoomsModal(true);
  };

  /**
   * Handle close manage rooms modal
   */
  const handleCloseManageRoomsModal = () => {
    setManagingRoomsEvent(null);
    setShowManageRoomsModal(false);
  };

  /**
   * Handle manage invites
   */
  const handleManageInvites = (event) => {
    setManagingInvitesEvent(event);
    setShowManageInvitesModal(true);
  };

  /**
   * Handle close manage invites modal
   */
  const handleCloseManageInvitesModal = () => {
    setManagingInvitesEvent(null);
    setShowManageInvitesModal(false);
  };

  /**
   * Handle invite created
   */
  const handleInviteCreated = () => {
    // Could refresh event details or show notification
    console.log('Invite created successfully');
  };

  /**
   * Handle rooms updated
   */
  const handleRoomsUpdated = () => {
    // Close the modal
    handleCloseManageRoomsModal();
    // Refresh the event details if we're viewing the same event
    if (selectedEventId === managingRoomsEvent?.eventId) {
      // The EventDetailsPage will refresh when it re-renders
      window.location.reload();
    }
  };

  /**
   * Handle URL hash changes for routing
   */
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Remove the #

      if (hash.startsWith('invite/')) {
        const code = hash.split('/')[1];
        setInviteCode(code);
        setCurrentPage(`invite/${code}`);
      } else if (hash.startsWith('event-details/')) {
        const eventId = hash.split('/')[1].split('#')[0]; // Remove any tab hash
        setSelectedEventId(eventId);
        setCurrentPage(`event-details/${eventId}`);

        // Extract tab from hash if present
        if (hash.includes('#tab=')) {
          const tab = hash.split('#tab=')[1];
          if (['event', 'rooms', 'invites', 'attendees'].includes(tab)) {
            setCurrentTab(tab);
          } else {
            setCurrentTab('event');
          }
        } else if (hash.includes('%23tab=')) {
          const tab = hash.split('%23tab=')[1];
          if (['event', 'rooms', 'invites', 'attendees'].includes(tab)) {
            setCurrentTab(tab);
          } else {
            setCurrentTab('event');
          }
        } else {
          setCurrentTab('event');
        }
      } else if (hash === 'events') {
        setCurrentPage('events');
      } else if (hash === 'venues') {
        setCurrentPage('venues');
      } else if (hash.startsWith('login')) {
        setCurrentPage('login');
        // Parse redirect parameter
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const redirect = urlParams.get('redirect');
        if (redirect) {
          setRedirectAfterAuth(redirect);
        }
      } else if (hash === 'home') {
        setCurrentPage('home');
      } else {
        setCurrentPage('home');
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  /**
   * Handle browser back/forward navigation
   */
  // Handle initial page load
  useEffect(() => {
    const handleInitialLoad = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentPage(hash);

      // Parse eventId from hash if it's an event-details page
      if (hash.startsWith('event-details/')) {
        const eventId = hash.split('/')[1].split('#')[0]; // Remove any tab hash
        setSelectedEventId(eventId);

        // Extract tab from hash if present
        if (hash.includes('#tab=')) {
          const tab = hash.split('#tab=')[1];
          if (['event', 'rooms', 'invites', 'attendees'].includes(tab)) {
            setCurrentTab(tab);
          } else {
            setCurrentTab('event');
          }
        } else if (hash.includes('%23tab=')) {
          const tab = hash.split('%23tab=')[1];
          if (['event', 'rooms', 'invites', 'attendees'].includes(tab)) {
            setCurrentTab(tab);
          } else {
            setCurrentTab('event');
          }
        } else {
          setCurrentTab('event');
        }
      } else {
        setSelectedEventId(null);
        setCurrentTab('event');
      }
    };

    // Handle initial load
    handleInitialLoad();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentPage(hash);

      // Parse eventId from hash if it's an event-details page
      if (hash.startsWith('event-details/')) {
        const eventId = hash.split('/')[1].split('#')[0]; // Remove any tab hash
        setSelectedEventId(eventId);

        // Extract tab from hash if present
        if (hash.includes('#tab=')) {
          const tab = hash.split('#tab=')[1];
          if (['event', 'rooms', 'invites', 'attendees'].includes(tab)) {
            setCurrentTab(tab);
          } else {
            setCurrentTab('event');
          }
        } else if (hash.includes('%23tab=')) {
          const tab = hash.split('%23tab=')[1];
          if (['event', 'rooms', 'invites', 'attendees'].includes(tab)) {
            setCurrentTab(tab);
          } else {
            setCurrentTab('event');
          }
        } else {
          setCurrentTab('event');
        }
      } else {
        setSelectedEventId(null);
        setCurrentTab('event');
      }
    };

    // Listen for browser navigation
    window.addEventListener('popstate', handlePopState);

    // Set initial page from URL
    handlePopState();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  /**
   * Update URL when page changes
   */
  useEffect(() => {
    if (currentPage !== 'home') {
      window.history.pushState(null, '', `#${currentPage}`);
    } else {
      window.history.pushState(null, '', '#');
    }
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-white">Game Planner</h1>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => handleNavigation('home')}
                className={`transition-colors ${
                  currentPage === 'home'
                    ? 'text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => handleNavigation('events')}
                className={`transition-colors ${
                  currentPage === 'events'
                    ? 'text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Events
              </button>
              <button
                onClick={() => handleNavigation('venues')}
                className={`transition-colors ${
                  currentPage === 'venues'
                    ? 'text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Venues
              </button>
              <button
                onClick={() => handleNavigation('games')}
                className={`transition-colors ${
                  currentPage === 'games'
                    ? 'text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Games
              </button>
            </nav>

            {/* Authentication Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <UserProfile
                  user={user}
                  onLogout={handleLogout}
                  loading={loading}
                />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        {currentPage === 'events' ? (
          <EventsPage
            onViewEventDetails={handleViewEventDetails}
            currentUser={user}
          />
        ) : currentPage.startsWith('event-details/') && selectedEventId ? (
          <EventDetailsPage
            eventId={selectedEventId}
            onBack={handleBackFromEventDetails}
            currentUser={user}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onManageRooms={handleManageRooms}
            onManageInvites={handleManageInvites}
            initialTab={currentTab}
          />
        ) : currentPage.startsWith('invite/') && inviteCode ? (
          <InviteRedemptionPage
            inviteCode={inviteCode}
            onBack={() => setCurrentPage('home')}
            onLoginWithRedirect={handleLoginWithRedirect}
          />
        ) : currentPage === 'venues' ? (
          <VenuesPage
            onEditVenue={handleEditVenue}
            onVenueUpdated={handleVenueUpdated}
          />
        ) : currentPage === 'edit-venue' && editVenueId ? (
          <EditVenuePage
            venueId={editVenueId}
            onBack={handleBackFromEditVenue}
            onVenueUpdated={handleVenueUpdated}
          />
        ) : currentPage === 'login' ? (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
              <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                  Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                  Or{' '}
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="font-medium text-blue-400 hover:text-blue-300"
                  >
                    create a new account
                  </button>
                </p>
              </div>
              <div className="mt-8 space-y-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <LoginForm
                    onSwitchToSignup={() => setShowAuthModal(true)}
                    onLoginSuccess={handleAuthSuccess}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {isAuthenticated ? (
                <Dashboard
                  user={user}
                  onViewEventDetails={handleViewEventDetails}
                />
              ) : (
                <HelloWorld onShowAuth={() => setShowAuthModal(true)} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        event={editingEvent}
        isOpen={showEditEventModal}
        onClose={handleCloseEditEventModal}
        onEventUpdated={handleEventUpdated}
        currentUser={user}
      />

      {/* Delete Event Modal */}
      <DeleteEventModal
        event={deletingEvent}
        isOpen={showDeleteEventModal}
        onClose={handleCloseDeleteEventModal}
        onEventDeleted={handleEventDeleted}
      />

      {/* Manage Event Rooms Modal */}
      <ManageEventRoomsModal
        event={managingRoomsEvent}
        isOpen={showManageRoomsModal}
        onClose={handleCloseManageRoomsModal}
        onRoomsUpdated={handleRoomsUpdated}
        currentUser={user}
      />

      {/* Manage Event Invites Modal */}
      <ManageInvitesModal
        event={managingInvitesEvent}
        isOpen={showManageInvitesModal}
        onClose={handleCloseManageInvitesModal}
        onInviteCreated={handleInviteCreated}
      />
    </div>
  );
}

// Dashboard component for authenticated users
function Dashboard({ user, onViewEventDetails }) {
  const { sessionToken } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch participant count for a specific event
  const fetchParticipantCount = async (eventId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/event-participants/event/${eventId}/public`
      );
      const data = await response.json();

      if (data.success) {
        const count = data.data ? data.data.length : 0;
        setParticipantCounts((prev) => ({
          ...prev,
          [eventId]: count,
        }));
      }
    } catch (err) {
      console.error(
        `Error fetching participant count for event ${eventId}:`,
        err
      );
    }
  };

  // Fetch participant counts for all events
  const fetchAllParticipantCounts = async (eventsList) => {
    const promises = eventsList.map((event) =>
      fetchParticipantCount(event.eventId)
    );
    await Promise.all(promises);
  };

  // Fetch upcoming events for the user
  const fetchUpcomingEvents = async () => {
    if (!sessionToken) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/events', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const events = data.data || [];
        const now = new Date();

        // Filter for upcoming events (active status and future dates)
        const upcoming = events.filter((event) => {
          if (event.status !== 'active') return false;
          const eventDate = new Date(event.eventDate);
          return eventDate >= now;
        });

        // Sort by event date (soonest first)
        upcoming.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

        setUpcomingEvents(upcoming);
        // Fetch participant counts for all upcoming events
        await fetchAllParticipantCounts(upcoming);
      } else {
        setError(data.message || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
      setError('Failed to fetch upcoming events');
    } finally {
      setLoading(false);
    }
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchUpcomingEvents();
  }, [sessionToken]);

  // Format date for display
  const formatEventDate = (dateString) => {
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

  // Format time for display
  const formatEventTime = (timeString) => {
    if (!timeString) return '';
    try {
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading your events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-900 border border-red-700 rounded-md p-4 max-w-md mx-auto">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {user.name}! 🎮
        </h1>
        <p className="text-xl text-gray-300">
          Ready to plan your next gaming session?
        </p>
      </div>

      {/* Upcoming Events Section */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-6">
          Your Upcoming Events
        </h2>

        {upcomingEvents.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No upcoming events
            </h3>
            <p className="text-gray-400 mb-6">
              You don't have any upcoming events yet. Create your first event or
              join one!
            </p>
            <div className="space-x-4">
              <a
                href="#events"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Browse Events
              </a>
              <a
                href="#events"
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Create Event
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <div
                key={event.eventId}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => onViewEventDetails(event.eventId)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {event.eventName}
                  </h3>
                  <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>

                <div className="space-y-3">
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
                    <span className="text-sm">
                      {formatEventDate(event.eventDate)}
                    </span>
                  </div>

                  {event.startTime && (
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm">
                        {formatEventTime(event.startTime)}
                      </span>
                    </div>
                  )}

                  {event.maxParticipants > 0 && (
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
                      <span className="text-sm">
                        {participantCounts[event.eventId] || 0} /{' '}
                        {event.maxParticipants} participants
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-blue-400 text-sm font-medium">
                    Click to view details →
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Hello World component to verify basic functionality
function HelloWorld({ onShowAuth }) {
  const [count, setCount] = useState(0);

  return (
    <div className="text-center">
      <div className="bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            Hello World! 🎮
          </h2>
          <p className="text-lg text-gray-300 mb-6">
            Welcome to the Game Planner skeleton app. This is a basic React
            application ready for extension.
          </p>

          <div className="bg-blue-900 border border-blue-700 rounded-md p-4 mb-6">
            <p className="text-blue-200">
              <strong>Counter Test:</strong> Click the button to verify React
              state management is working.
            </p>
            <div className="mt-4">
              <button
                onClick={() => setCount(count + 1)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Count: {count}
              </button>
            </div>
          </div>

          <div className="bg-yellow-900 border border-yellow-700 rounded-md p-4 mb-6">
            <p className="text-yellow-200">
              <strong>Authentication Ready:</strong> Click the "Sign In" button
              above to test the authentication system.
            </p>
            <div className="mt-4">
              <button
                onClick={onShowAuth}
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Try Authentication
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="bg-gray-700 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-white mb-2">✅ React Setup</h3>
              <p className="text-gray-300">Basic React components working</p>
            </div>
            <div className="bg-gray-700 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-white mb-2">✅ Tailwind CSS</h3>
              <p className="text-gray-300">Responsive styling configured</p>
            </div>
            <div className="bg-gray-700 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-white mb-2">✅ Mobile-First</h3>
              <p className="text-gray-300">Responsive design ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// App component is now rendered in index.html with AuthProvider wrapper
