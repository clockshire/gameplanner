/**
 * User Profile Component
 * Displays user information and logout functionality
 */

function UserProfile({ user, onLogout, loading }) {
  return (
    <div className="flex items-center space-x-4">
      {/* User Info */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </span>
        </div>
        <div className="hidden sm:block">
          <p className="text-white font-medium">{user.name}</p>
          <p className="text-gray-300 text-sm">{user.email}</p>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        disabled={loading}
        className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
      >
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

// Export component
window.UserProfile = UserProfile;
