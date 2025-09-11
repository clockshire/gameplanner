/**
 * Delete Venue Modal Component
 * Enhanced confirmation dialog for venue deletion with validation
 */

const { useState, useEffect } = React;

/**
 * DeleteVenueModal component
 * Shows detailed confirmation with event validation and room cascading info
 */
function DeleteVenueModal({ isOpen, onClose, venueId, venueName, onVenueDeleted }) {
  const [deletionInfo, setDeletionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch deletion information for the venue
   */
  const fetchDeletionInfo = async () => {
    if (!venueId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3001/api/venues/${venueId}/deletion-info`
      );
      const data = await response.json();

      if (data.success) {
        setDeletionInfo(data.data);
      } else {
        setError(data.message || 'Failed to fetch deletion information');
      }
    } catch (err) {
      console.error('Error fetching deletion info:', err);
      setError('Failed to fetch deletion information');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle venue deletion
   */
  const handleDelete = async () => {
    if (!deletionInfo || !deletionInfo.canDelete) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(
        `http://localhost:3001/api/venues/${venueId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (result.success) {
        // Notify parent component
        onVenueDeleted();
        onClose();
      } else {
        setError(result.message || 'Failed to delete venue');
      }
    } catch (err) {
      console.error('Error deleting venue:', err);
      setError('Failed to delete venue');
    } finally {
      setDeleting(false);
    }
  };

  // Fetch deletion info when modal opens
  useEffect(() => {
    if (isOpen && venueId) {
      fetchDeletionInfo();
    }
  }, [isOpen, venueId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Delete Venue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={deleting}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
                <h3 className="text-sm font-medium">Error</h3>
                <div className="mt-2 text-sm">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={fetchDeletionInfo}
                    className="bg-red-800 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deletion Info */}
        {!loading && !error && deletionInfo && (
          <div className="space-y-6">
            {/* Venue Name */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Are you sure you want to delete "{venueName}"?
              </h3>
            </div>

            {/* Event References Block */}
            {deletionInfo.hasEventReferences && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Cannot Delete Venue</h3>
                    <div className="mt-2 text-sm">
                      <p className="mb-2">
                        This venue cannot be deleted because it is referenced by the following event(s):
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {deletionInfo.events.map((event) => (
                          <li key={event.eventId} className="font-medium">
                            {event.eventName} ({event.eventDate})
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs">
                        Please remove or reassign these events before deleting the venue.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Room Cascading Info */}
            {!deletionInfo.hasEventReferences && deletionInfo.rooms.length > 0 && (
              <div className="bg-yellow-900 border border-yellow-700 text-yellow-100 px-4 py-3 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Warning: Associated Rooms Will Be Deleted</h3>
                    <div className="mt-2 text-sm">
                      <p className="mb-2">
                        Deleting this venue will also permanently delete the following {deletionInfo.rooms.length} room(s):
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {deletionInfo.rooms.map((room) => (
                          <li key={room.roomId} className="font-medium">
                            {room.roomName} (Capacity: {room.capacity})
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs">
                        This action cannot be undone. All room data will be permanently lost.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Safe to Delete */}
            {!deletionInfo.hasEventReferences && deletionInfo.rooms.length === 0 && (
              <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Safe to Delete</h3>
                    <div className="mt-2 text-sm">
                      <p>This venue has no associated events or rooms and can be safely deleted.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!deletionInfo?.canDelete || deleting}
                className={`px-6 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  deletionInfo?.canDelete
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {deleting ? 'Deleting...' : 'Delete Venue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Make DeleteVenueModal available globally
window.DeleteVenueModal = DeleteVenueModal;
