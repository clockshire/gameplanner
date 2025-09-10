/**
 * Venues Page Component
 * Displays a list of all venues
 */

const { useState, useEffect } = React;

/**
 * VenuesPage component
 * Shows all venues with proper formatting and empty state
 */
function VenuesPage({ onEditVenue, onVenueUpdated }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [venueRooms, setVenueRooms] = useState({});

  /**
   * Fetch venues from the API
   */
  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/venues');
      const data = await response.json();

      if (data.success) {
        setVenues(data.data || []);
        // Fetch rooms for each venue
        fetchRoomsForVenues(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch venues');
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch rooms for all venues
   * @param {Array} venues - Array of venue objects
   */
  const fetchRoomsForVenues = async (venues) => {
    const roomsData = {};

    for (const venue of venues) {
      try {
        const response = await fetch(
          `http://localhost:3001/api/rooms/venue/${venue.venueId}`
        );
        const data = await response.json();

        if (data.success) {
          roomsData[venue.venueId] = data.data || [];
        } else {
          console.warn(
            `Failed to fetch rooms for venue ${venue.venueId}:`,
            data.message
          );
          roomsData[venue.venueId] = [];
        }
      } catch (err) {
        console.warn(`Error fetching rooms for venue ${venue.venueId}:`, err);
        roomsData[venue.venueId] = [];
      }
    }

    setVenueRooms(roomsData);
  };

  /**
   * Calculate room summary for a venue
   * @param {string} venueId - Venue ID
   * @returns {Object} Room summary with count and total capacity
   */
  const getRoomSummary = (venueId) => {
    const rooms = venueRooms[venueId] || [];
    const totalCapacity = rooms.reduce(
      (sum, room) => sum + (room.capacity || 0),
      0
    );

    return {
      count: rooms.length,
      totalCapacity: totalCapacity,
      rooms: rooms,
    };
  };

  /**
   * Handle venue creation
   */
  const handleVenueCreated = () => {
    // Refresh the venues list
    fetchVenues();
  };

  /**
   * Handle venue deletion
   * @param {string} venueId - Venue ID to delete
   */
  const handleDeleteVenue = async (venueId) => {
    if (!confirm('Are you sure you want to delete this venue?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/venues/${venueId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (result.success) {
        // Refresh the venues list
        fetchVenues();
      } else {
        alert(result.message || 'Failed to delete venue');
      }
    } catch (err) {
      console.error('Error deleting venue:', err);
      alert('Failed to delete venue');
    }
  };

  // Fetch venues on component mount
  useEffect(() => {
    fetchVenues();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Venues</h1>
              <p className="text-gray-400">
                Manage venues where events can be hosted
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors"
              >
                Add Venue
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
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
                <h3 className="text-sm font-medium">Error loading venues</h3>
                <div className="mt-2 text-sm">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={fetchVenues}
                    className="bg-red-800 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && venues.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No Venues Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Get started by adding your first venue where events can be hosted.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors"
            >
              Add Your First Venue
            </button>
          </div>
        )}

        {/* Venues List */}
        {!loading && !error && venues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <div
                key={venue.venueId}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-white">
                        {venue.venueName}
                      </h3>
                      <button
                        onClick={() => handleDeleteVenue(venue.venueId)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete venue"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    {venue.description && (
                      <p className="text-gray-300 mb-4 text-sm">
                        {venue.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-400">
                      {venue.address && (
                        <div className="flex items-start">
                          <svg
                            className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {venue.mapLink ? (
                            <a
                              href={venue.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 break-words underline"
                            >
                              {venue.address}
                            </a>
                          ) : (
                            <span className="break-words">{venue.address}</span>
                          )}
                        </div>
                      )}

                      {(venue.contactPhone || venue.contactEmail || venue.websiteURL) && (
                        <div className="space-y-2">
                          {venue.contactPhone && (
                            <div className="flex items-start">
                              <svg
                                className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              <a
                                href={`tel:${venue.contactPhone}`}
                                className="text-blue-400 hover:text-blue-300 break-words underline"
                              >
                                {venue.contactPhone}
                              </a>
                            </div>
                          )}
                          {venue.contactEmail && (
                            <div className="flex items-start">
                              <svg
                                className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              <a
                                href={`mailto:${venue.contactEmail}`}
                                className="text-blue-400 hover:text-blue-300 break-words underline"
                              >
                                {venue.contactEmail}
                              </a>
                            </div>
                          )}
                          {venue.websiteURL && (
                            <div className="flex items-start">
                              <svg
                                className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                              <a
                                href={venue.websiteURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 break-words underline"
                              >
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {venue.capacity > 0 && (
                        <div className="flex items-center">
                          <svg
                            className="h-4 w-4 mr-2 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span>Capacity: {venue.capacity} people</span>
                        </div>
                      )}

                      {/* Room Summary */}
                      {(() => {
                        const roomSummary = getRoomSummary(venue.venueId);
                        if (roomSummary.count > 0) {
                          return (
                            <div className="flex items-center">
                              <svg
                                className="h-4 w-4 mr-2 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              <div className="flex flex-wrap gap-1">
                                {roomSummary.rooms.map((room, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium bg-blue-900 text-blue-200 border border-blue-700"
                                  >
                                    {room.roomName} ({room.capacity} 👥)
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center">
                              <svg
                                className="h-4 w-4 mr-2 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              <span className="text-gray-500 text-sm">
                                No rooms added yet
                              </span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        Created:{' '}
                        {new Date(venue.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => onEditVenue(venue.venueId)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Edit Venue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Venue Modal */}
        <CreateVenueModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onVenueCreated={handleVenueCreated}
        />
      </div>
    </div>
  );
}

// Make VenuesPage available globally
window.VenuesPage = VenuesPage;
