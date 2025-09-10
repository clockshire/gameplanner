/**
 * Edit Event Modal Component
 * Modal for editing existing events
 */

const { useState, useEffect } = React;

/**
 * EditEventModal component
 * Provides a form to edit event details
 */
function EditEventModal({
  event,
  isOpen,
  onClose,
  onEventUpdated,
  currentUser,
}) {
  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    maxParticipants: '',
    status: 'active',
  });
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize form data when event changes
   */
  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.eventName || '',
        description: event.description || '',
        eventDate: event.eventDate || '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        maxParticipants: event.maxParticipants || '',
        status: event.status || 'active',
      });
      setSelectedVenueId(event.venueId || '');
    }
  }, [event]);

  /**
   * Fetch venues for the dropdown
   */
  const fetchVenues = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/venues');
      const data = await response.json();

      if (data.success) {
        setVenues(data.data);
      } else {
        console.error('Failed to fetch venues:', data.message);
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
    }
  };

  /**
   * Load venues when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      fetchVenues();
    }
  }, [isOpen]);

  /**
   * Handle form input changes
   * @param {Event} e - Input event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!event?.eventId) {
      setError('Event ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const eventData = {
        eventName: formData.eventName.trim(),
        description: formData.description.trim(),
        eventDate: formData.eventDate,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : null,
        status: formData.status,
        venueId: selectedVenueId || null,
        createdBy: currentUser?.userId,
      };

      const response = await fetch(
        `http://localhost:3001/api/events/${event.eventId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      );

      const data = await response.json();

      if (data.success) {
        onEventUpdated(data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to update event');
      }
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Event</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="h-6 w-6"
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
          </div>

          {/* Error Message */}
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
                  <h3 className="text-sm font-medium">Error</h3>
                  <div className="mt-2 text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div>
              <label
                htmlFor="eventName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Event Name *
              </label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event name"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event description"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="eventDate"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Event Date *
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Venue and Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="venueId"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Venue
                </label>
                <select
                  id="venueId"
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a venue</option>
                  {venues.map((venue) => (
                    <option key={venue.venueId} value={venue.venueId}>
                      {venue.venueName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="maxParticipants"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Max Participants
                </label>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {loading ? 'Updating...' : 'Update Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Make EditEventModal available globally
window.EditEventModal = EditEventModal;
