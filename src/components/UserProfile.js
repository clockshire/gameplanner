/**
 * User Profile Component
 * Displays user avatar with dropdown menu
 */

const { useState, useEffect, useRef } = React;

function UserProfile({ user, onLogout, loading }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        <span className="text-white font-bold text-sm">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50">
          {/* User Info Section */}
          <div className="flex items-center px-4 py-3 border-b border-gray-700">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user.name || 'Unknown User'}
              </p>
              <p className="text-gray-400 text-xs truncate">{user.email}</p>
            </div>
          </div>

          {/* Menu Options */}
          <div className="py-1">
            {/* Your Profile */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4 mr-3"
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
              Your profile
            </button>

            {/* Log Out */}
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {loading ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export component
window.UserProfile = UserProfile;
