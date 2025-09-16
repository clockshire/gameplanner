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
  const { sessionToken } = useAuth();
  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    eventDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    maxParticipants: '',
    status: 'active',
  });
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize form data when event changes
   */
  useEffect(() => {
    if (event && sessionToken) {
      setFormData({
        eventName: event.eventName || '',
        description: event.description || '',
        eventDate: event.eventDate || '',
        endDate: event.endDate || event.eventDate || '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        maxParticipants: event.maxParticipants || '',
        status: event.status || 'active',
      });
      setSelectedVenueId(event.venueId || '');
      setSelectedRoomIds(event.assignedRoomIds || []);

      // Fetch venues and rooms when event data is loaded
      fetchVenues();
      if (event.venueId) {
        fetchRooms(event.venueId);
      }
    }
  }, [event, sessionToken]);

  /**
   * Fetch venues for the dropdown
   */
  const fetchVenues = async () => {
    try {
      if (!sessionToken) {
        console.warn('No session token available for fetching venues');
        return;
      }

      const headers = {
        Authorization: `Bearer ${sessionToken}`,
      };

      const response = await fetch('http://localhost:3001/api/venues', {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        setVenues(data.data || []);
        console.log('Venues fetched successfully:', data.data?.length || 0);
      } else {
        console.error('Failed to fetch venues:', data.message);
        setError(`Failed to load venues: ${data.message}`);
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to load venues');
    }
  };

  /**
   * Fetch rooms for the selected venue
   * @param {string} venueId - Venue ID
   */
  const fetchRooms = async (venueId) => {
    if (!venueId) {
      setRooms([]);
      return;
    }

    try {
      const headers = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/rooms/venue/${venueId}`,
        { headers }
      );
      const data = await response.json();

      if (data.success) {
        setRooms(data.data || []);
      } else {
        console.error('Failed to fetch rooms:', data.message);
        setRooms([]);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setRooms([]);
    }
  };

  /**
   * Load venues when modal opens
   */
  useEffect(() => {
    if (isOpen && sessionToken) {
      fetchVenues();
    }
  }, [isOpen, sessionToken]);

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
   * Handle venue selection change
   * @param {Event} e - Select event
   */
  const handleVenueChange = (e) => {
    const venueId = e.target.value;
    setSelectedVenueId(venueId);
    setSelectedRoomIds([]); // Clear room selection when venue changes
    fetchRooms(venueId);
  };

  /**
   * Handle room selection change
   * @param {Event} e - Checkbox event
   */
  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    const isChecked = e.target.checked;

    if (isChecked) {
      setSelectedRoomIds((prev) => [...prev, roomId]);
    } else {
      setSelectedRoomIds((prev) => prev.filter((id) => id !== roomId));
    }
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
        endDate: formData.endDate || formData.eventDate, // Default to start date if no end date
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : null,
        status: formData.status,
        venueId: selectedVenueId || null,
        assignedRoomIds: selectedRoomIds,
        createdBy: currentUser?.userId,
      };

      const headers = {
        'Content-Type': 'application/json',
      };
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/events/${event.eventId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(eventData),
        }
      );

      const data = await response.json();

      if (data.success) {
        onEventUpdated(data.data);
        onClose();
      } else {
        console.error('Event update failed:', data);
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
            <div className="space-y-4">
              {/* Event Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="eventDate"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Start Date *
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
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.eventDate} // End date can't be before start date
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave empty for single-day events
                  </p>
                </div>
              </div>

              {/* Event Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onChange={handleVenueChange}
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

            {/* Room Assignment */}
            {selectedVenueId && rooms.length > 0 && (
              <div>
                <div className="block text-sm font-medium text-gray-300 mb-2">
                  Available Rooms
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-700">
                  {rooms.map((room) => (
                    <label
                      key={room.roomId}
                      className="flex items-center space-x-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        value={room.roomId}
                        checked={selectedRoomIds.includes(room.roomId)}
                        onChange={handleRoomChange}
                        className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-gray-300">
                        {room.roomName} ({room.capacity} 👥)
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Select which rooms will be available for this event
                </p>
              </div>
            )}

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
