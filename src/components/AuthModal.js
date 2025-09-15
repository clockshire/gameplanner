/**
 * Authentication Modal Component
 * Handles switching between login and signup forms
 */

const { useState } = React;

function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  /**
   * Handle successful authentication
   */
  const handleAuthSuccess = () => {
    onAuthSuccess && onAuthSuccess();
    onClose();
  };

  /**
   * Switch to login form
   */
  const switchToLogin = () => {
    setIsLogin(true);
  };

  /**
   * Switch to signup form
   */
  const switchToSignup = () => {
    setIsLogin(false);
  };

  /**
   * Handle modal backdrop click
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center z-10"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Auth Form */}
        {isLogin ? (
          <LoginForm
            onSwitchToSignup={switchToSignup}
            onLoginSuccess={handleAuthSuccess}
          />
        ) : (
          <SignupForm
            onSwitchToLogin={switchToLogin}
            onSignupSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  );
}

// Export component
window.AuthModal = AuthModal;
