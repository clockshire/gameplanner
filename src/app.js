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
                <AuthenticatedContent user={user} />
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

// Authenticated content component
function AuthenticatedContent({ user }) {
  return (
    <div className="text-center">
      <div className="bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            Welcome back, {user.name}! 🎮
          </h2>
          <p className="text-lg text-gray-300 mb-6">
            You're now logged in and ready to plan your gaming sessions.
          </p>

          <div className="bg-green-900 border border-green-700 rounded-md p-4 mb-6">
            <p className="text-green-200">
              <strong>Authentication Success:</strong> You're logged in as{' '}
              {user.email}
            </p>
            <p className="text-green-300 text-sm mt-2">
              Member since: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="bg-gray-700 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-white mb-2">
                ✅ User Authentication
              </h3>
              <p className="text-gray-300">Login/signup system working</p>
            </div>
            <div className="bg-gray-700 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-white mb-2">
                ✅ Session Management
              </h3>
              <p className="text-gray-300">User session active</p>
            </div>
            <div className="bg-gray-700 p-4 rounded border border-gray-600">
              <h3 className="font-semibold text-white mb-2">
                ✅ Ready for Events
              </h3>
              <p className="text-gray-300">Protected features available</p>
            </div>
          </div>
        </div>
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
