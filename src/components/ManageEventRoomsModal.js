/**
 * Manage Event Rooms Modal Component
 * Modal for selecting rooms from venue and setting their time availability for a specific event
 */

const { useState, useEffect } = React;

/**
 * ManageEventRoomsModal component
 * Provides interface to select venue rooms and set their time availability for an event
 */
function ManageEventRoomsModal({
  event,
  isOpen,
  onClose,
  onRoomsUpdated,
  currentUser,
}) {
  const [venueRooms, setVenueRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomTimes, setRoomTimes] = useState({});
  const [copyFromRoom, setCopyFromRoom] = useState('');

  /**
   * Generate event dates for the dropdown
   * Returns array of date objects with formatted display text and ISO date values
   */
  const generateEventDates = () => {
    if (!event?.eventDate) return [];

    const startDate = new Date(event.eventDate);
    const endDate = new Date(event.endDate || event.eventDate);

    const dates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayName = currentDate.toLocaleDateString('en-GB', {
        weekday: 'long',
      });
      const dayNumber = currentDate.getDate();
      const monthName = currentDate.toLocaleDateString('en-GB', {
        month: 'long',
      });
      const year = currentDate.getFullYear();

      dates.push({
        value: currentDate.toISOString().split('T')[0], // ISO date string (YYYY-MM-DD)
        label: `${dayName}, ${dayNumber}${getOrdinalSuffix(
          dayNumber
        )} ${monthName} ${year}`,
        dayOfWeek: dayName.toLowerCase(),
        date: new Date(currentDate),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  /**
   * Get ordinal suffix for day numbers (1st, 2nd, 3rd, etc.)
   */
  const getOrdinalSuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  /**
   * Format event date for display
   */
  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
      const dayNumber = date.getDate();
      const monthName = date.toLocaleDateString('en-GB', { month: 'long' });
      const year = date.getFullYear();

      return `${dayName}, ${dayNumber}${getOrdinalSuffix(
        dayNumber
      )} ${monthName} ${year}`;
    } catch (error) {
      return dateString; // Fallback to original string
    }
  };

  /**
   * Copy time slots from one room to another
   */
  const copyTimeSlots = (fromRoomId, toRoomId) => {
    if (!fromRoomId || !toRoomId || fromRoomId === toRoomId) return;

    const sourceTimes = roomTimes[fromRoomId] || [];
    if (sourceTimes.length === 0) return;

    // Create a deep copy of the time slots
    const copiedTimes = sourceTimes.map((slot) => ({
      ...slot,
      // Reset any unique identifiers if they exist
    }));

    setRoomTimes((prev) => ({
      ...prev,
      [toRoomId]: copiedTimes,
    }));

    // Clear the copy selection
    setCopyFromRoom('');
  };

  /**
   * Initialize rooms when modal opens
   */
  useEffect(() => {
    if (isOpen && event) {
      fetchVenueRooms();
      fetchEventRoomAssignments();
    }
  }, [isOpen, event]);

  /**
   * Fetch rooms for the event's venue
   */
  const fetchVenueRooms = async () => {
    if (!event?.venueId) {
      setVenueRooms([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/rooms/venue/${event.venueId}`
      );
      const data = await response.json();

      if (data.success) {
        setVenueRooms(data.data || []);
      } else {
        console.error('Failed to fetch venue rooms:', data.message);
        setVenueRooms([]);
      }
    } catch (err) {
      console.error('Error fetching venue rooms:', err);
      setVenueRooms([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch current room assignments for this event
   */
  const fetchEventRoomAssignments = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/events/${event.eventId}/rooms`
      );
      const data = await response.json();

      if (data.success) {
        const assignments = data.data || [];
        console.log('Fetched room assignments:', assignments);

        // Map room assignments to selected rooms
        const roomIds = assignments
          .map((room) => room.roomId)
          .filter((id) => id !== 'undefined');
        setSelectedRooms(roomIds);

        // Set up room times
        const times = {};
        assignments.forEach((room) => {
          if (room.roomId && room.roomId !== 'undefined') {
            times[room.roomId] = room.availableTimes || [];
          }
        });
        setRoomTimes(times);

        console.log('Selected rooms:', roomIds);
        console.log('Room times:', times);
      } else {
        console.error('Failed to fetch event room assignments:', data.message);
        setSelectedRooms([]);
        setRoomTimes({});
      }
    } catch (err) {
      console.error('Error fetching event room assignments:', err);
      setSelectedRooms([]);
      setRoomTimes({});
    }
  };

  /**
   * Handle selecting/deselecting a room
   */
  const handleRoomSelection = (roomId, isSelected) => {
    if (isSelected) {
      setSelectedRooms((prev) => [...prev, roomId]);
      setRoomTimes((prev) => ({
        ...prev,
        [roomId]: [],
      }));
    } else {
      setSelectedRooms((prev) => prev.filter((id) => id !== roomId));
      setRoomTimes((prev) => {
        const newTimes = { ...prev };
        delete newTimes[roomId];
        return newTimes;
      });
    }
  };

  /**
   * Handle saving room assignments
   */
  const handleSaveRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, clear existing assignments
      await fetch(`http://localhost:3001/api/events/${event.eventId}/rooms`, {
        method: 'DELETE',
      });

      // Prepare room assignments for bulk update
      const roomAssignments = [];
      for (const roomId of selectedRooms) {
        const room = venueRooms.find((r) => r.roomId === roomId);
        if (room) {
          const availableTimes = roomTimes[roomId] || [];
          // Save room even if no time slots - user can add them later
          const roomData = {
            roomId: roomId,
            roomName: room.roomName,
            capacity: room.capacity,
            description: room.description,
            availableTimes: availableTimes,
            createdBy: currentUser?.userId,
          };
          roomAssignments.push(roomData);
        }
      }

      // Use bulk update endpoint
      const response = await fetch(
        `http://localhost:3001/api/events/${event.eventId}/rooms`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rooms: roomAssignments }),
        }
      );

      const data = await response.json();
      if (data.success) {
        onRoomsUpdated();
      } else {
        setError(data.message || 'Failed to save room assignments');
      }
    } catch (err) {
      setError('Error saving room assignments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new time slot for a room
   */
  const addTimeSlot = (roomId) => {
    const eventDates = generateEventDates();
    const defaultDate = eventDates.length > 0 ? eventDates[0].value : '';

    setRoomTimes((prev) => ({
      ...prev,
      [roomId]: [
        ...(prev[roomId] || []),
        { startTime: '', endTime: '', dayOfWeek: defaultDate },
      ],
    }));
  };

  /**
   * Update a time slot for a room
   */
  const updateTimeSlot = (roomId, index, field, value) => {
    setRoomTimes((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  /**
   * Remove a time slot for a room
   */
  const removeTimeSlot = (roomId, index) => {
    setRoomTimes((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || []).filter((_, i) => i !== index),
    }));
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setError(null);
    setRoomTimes({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Manage Rooms - {event?.eventName}
              </h2>
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
            {event && (
              <div className="mt-3 text-sm text-gray-300">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-6">
                  <span>
                    <strong>Event Start:</strong>{' '}
                    {formatEventDate(event.eventDate)}{' '}
                    {event.startTime && `at ${event.startTime}`}
                  </span>
                  {event.endDate && event.endDate !== event.eventDate && (
                    <span>
                      <strong>Event End:</strong>{' '}
                      {formatEventDate(event.endDate)}{' '}
                      {event.endTime && `at ${event.endTime}`}
                    </span>
                  )}
                </div>
              </div>
            )}
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

          {/* Venue Rooms Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Select Rooms from Venue
            </h3>

            {loading && venueRooms.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Loading venue rooms...</div>
              </div>
            ) : !event?.venueId ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  No venue selected for this event
                </div>
                <p className="text-gray-500 text-sm">
                  Please select a venue for this event first
                </p>
              </div>
            ) : venueRooms.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  No rooms available at this venue
                </div>
                <p className="text-gray-500 text-sm">
                  This venue doesn't have any rooms configured
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {venueRooms.map((room) => {
                  const isSelected = selectedRooms.includes(room.roomId);
                  const times = roomTimes[room.roomId] || [];

                  return (
                    <div
                      key={room.roomId}
                      className={`rounded-lg p-4 border ${
                        isSelected
                          ? 'bg-green-900 border-green-700'
                          : 'bg-gray-700 border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                handleRoomSelection(
                                  room.roomId,
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                            />
                            <h4 className="text-lg font-medium text-white">
                              {room.roomName}
                            </h4>
                            {room.capacity && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200 border border-blue-700">
                                {room.capacity} 👥
                              </span>
                            )}
                          </div>

                          {room.description && (
                            <p className="text-gray-300 text-sm mb-3">
                              {room.description}
                            </p>
                          )}

                          {/* Time Availability for Selected Rooms */}
                          {isSelected && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-gray-400">
                                  Available Times:
                                </h5>
                                <div className="flex items-center space-x-3">
                                  {/* Copy from dropdown */}
                                  {times.length === 0 && (
                                    <div className="flex items-center space-x-2">
                                      <label className="text-xs text-gray-400">
                                        Copy from:
                                      </label>
                                      <select
                                        value={copyFromRoom}
                                        onChange={(e) =>
                                          setCopyFromRoom(e.target.value)
                                        }
                                        className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                      >
                                        <option value="">Select room...</option>
                                        {venueRooms
                                          .filter(
                                            (r) =>
                                              r.roomId !== room.roomId &&
                                              roomTimes[r.roomId]?.length > 0
                                          )
                                          .map((r) => (
                                            <option
                                              key={r.roomId}
                                              value={r.roomId}
                                            >
                                              {r.roomName}
                                            </option>
                                          ))}
                                      </select>
                                      {copyFromRoom && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            copyTimeSlots(
                                              copyFromRoom,
                                              room.roomId
                                            )
                                          }
                                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                        >
                                          Copy
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => addTimeSlot(room.roomId)}
                                    className="text-green-400 hover:text-green-300 text-sm"
                                  >
                                    + Add Time Slot
                                  </button>
                                </div>
                              </div>

                              {times.map((slot, index) => (
                                <div
                                  key={index}
                                  className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2"
                                >
                                  <select
                                    value={slot.dayOfWeek}
                                    onChange={(e) =>
                                      updateTimeSlot(
                                        room.roomId,
                                        index,
                                        'dayOfWeek',
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm min-w-48"
                                  >
                                    {generateEventDates().map((dateOption) => (
                                      <option
                                        key={dateOption.value}
                                        value={dateOption.value}
                                      >
                                        {dateOption.label}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) =>
                                      updateTimeSlot(
                                        room.roomId,
                                        index,
                                        'startTime',
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) =>
                                      updateTimeSlot(
                                        room.roomId,
                                        index,
                                        'endTime',
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeTimeSlot(room.roomId, index)
                                    }
                                    className="text-red-400 hover:text-red-300 px-2 py-2"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}

                              {times.length === 0 && (
                                <p className="text-gray-400 text-sm">
                                  No time slots added yet. Click "Add Time Slot"
                                  to set availability.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save Changes Button */}
          {selectedRooms.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={handleSaveRooms}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {loading
                  ? 'Saving...'
                  : `Save ${selectedRooms.length} Room${
                      selectedRooms.length !== 1 ? 's' : ''
                    }`}
              </button>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t border-gray-700 mt-6">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ManageEventRoomsModal = ManageEventRoomsModal;
