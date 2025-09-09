const { useState } = React;

// Main App component
function App() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

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
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-white">Game Planner</h1>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Events
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Rooms
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Games
              </a>
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
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {isAuthenticated ? (
            <AuthenticatedContent user={user} />
          ) : (
            <HelloWorld onShowAuth={() => setShowAuthModal(true)} />
          )}
        </div>
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
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
