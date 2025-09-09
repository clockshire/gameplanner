/**
 * Authentication Context for Game Planner application
 * Manages user authentication state and provides auth methods
 */

const { createContext, useContext, useState, useEffect } = React;

// Create authentication context
const AuthContext = createContext();

/**
 * Authentication provider component
 * Manages authentication state and provides auth methods to children
 */
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE = 'http://localhost:3001/api';

  /**
   * Check for existing session on app load
   */
  useEffect(() => {
    checkExistingSession();
  }, []);

  /**
   * Check if user has an existing valid session
   */
  const checkExistingSession = async () => {
    try {
      const token = localStorage.getItem('sessionToken');
      if (token) {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data.user);
          setSessionToken(token);
        } else {
          // Invalid token, clear it
          localStorage.removeItem('sessionToken');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('sessionToken');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign up a new user
   * @param {string} email - User's email address
   * @param {string} name - User's display name
   * @returns {Promise<Object>} User data
   */
  const signup = async (email, name) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      return data.data.user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log in a user
   * @param {string} email - User's email address
   * @returns {Promise<Object>} User data and session token
   */
  const login = async (email) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store session token and user data
      localStorage.setItem('sessionToken', data.data.sessionToken);
      setSessionToken(data.data.sessionToken);
      setUser(data.data.user);

      return data.data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out the current user
   */
  const logout = async () => {
    try {
      if (sessionToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('sessionToken');
      setSessionToken(null);
      setUser(null);
      setError(null);
    }
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    sessionToken,
    loading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 * @returns {Object} Authentication context value
 */
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export components and hook
window.AuthProvider = AuthProvider;
window.useAuth = useAuth;
