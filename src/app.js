const { useState } = React;

// Main App component
function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-white">Game Planner</h1>
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <HelloWorld />
        </div>
      </main>
    </div>
  );
}

// Hello World component to verify basic functionality
function HelloWorld() {
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

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));
