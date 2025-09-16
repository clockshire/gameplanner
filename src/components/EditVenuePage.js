/**
 * Edit Venue Page Component
 * Page for editing an existing venue
 */

const { useState, useEffect } = React;

/**
 * EditVenuePage component
 * Handles venue editing with form validation
 */
function EditVenuePage({ venueId, onBack, onVenueUpdated }) {
  const { sessionToken } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    websiteURL: '',
    mapLink: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadResult, setImageUploadResult] = useState(null);
  const [imageDisplayUrl, setImageDisplayUrl] = useState(null);

  /**
   * Fetch venue data to populate the form
   */
  const fetchVenue = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const headers = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/venues/${venueId}`,
        { headers }
      );
      const data = await response.json();

      if (data.success) {
        const venue = data.data;
        setFormData({
          name: venue.venueName || '',
          description: venue.description || '',
          address: venue.address || '',
          contactPhone: venue.contactPhone || '',
          contactEmail: venue.contactEmail || '',
          websiteURL: venue.websiteURL || '',
          capacity: venue.capacity || '',
          mapLink: venue.mapLink || '',
          imageUrl: venue.imageUrl || '',
        });
      } else {
        setError(data.message || 'Failed to fetch venue');
      }
    } catch (err) {
      console.error('Error fetching venue:', err);
      setError('Failed to fetch venue');
    } finally {
      setInitialLoading(false);
    }
  };

  /**
   * Fetch rooms for this venue
   */
  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);

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
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  /**
   * Handle room creation
   */
  const handleRoomCreated = () => {
    fetchRooms();
  };

  /**
   * Handle room deletion
   * @param {string} roomId - Room ID to delete
   */
  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/rooms/${roomId}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (result.success) {
        fetchRooms();
      } else {
        alert(result.message || 'Failed to delete room');
      }
    } catch (err) {
      console.error('Error deleting room:', err);
      alert('Failed to delete room');
    }
  };

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
   * Handle image file selection
   * @param {Event} event - File input change event
   */
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedImage(file);
      setError(null);
    }
  };

  /**
   * Upload selected image
   */
  const handleImageUpload = async () => {
    if (!selectedImage || !sessionToken) {
      setError('Please select an image and ensure you are logged in');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('folder', 'venue-images');

      const response = await fetch('http://localhost:3001/api/images/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageUploadResult(result.data);
        setFormData((prev) => ({ ...prev, imageUrl: result.data.url }));

        // Generate presigned URL for display
        const displayUrl = await generateImageDisplayUrl(result.data.url);
        setImageDisplayUrl(displayUrl);

        setSelectedImage(null);
        // Reset file input
        document.getElementById('venue-image-input').value = '';
        setError(null);
      } else {
        setError(result.message || 'Image upload failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Generate presigned URL for image display
   */
  const generateImageDisplayUrl = async (imageUrl) => {
    if (!imageUrl || !sessionToken) return null;

    try {
      // Extract the key from the MinIO URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.substring(1).split('/'); // Remove leading slash and split
      const key = pathParts.slice(1).join('/'); // Remove bucket name, keep only object key

      console.log('Original imageUrl:', imageUrl);
      console.log('Path parts:', pathParts);
      console.log('Extracted key:', key);

      const response = await fetch(
        `http://localhost:3001/api/images/presigned/${encodeURIComponent(
          key
        )}?expiresIn=3600`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      const result = await response.json();
      console.log('Presigned URL result:', result);
      console.log('Presigned URL data:', result.data);
      console.log('Presigned URL:', result.data?.url);
      return result.success ? result.data.url : null;
    } catch (err) {
      console.error('Error generating presigned URL:', err);
      return null;
    }
  };

  /**
   * Remove current image
   */
  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setImageUploadResult(null);
    setImageDisplayUrl(null);
    setSelectedImage(null);
    // Reset file input
    const fileInput = document.getElementById('venue-image-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data for API
      const venueData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        contactPhone: formData.contactPhone || null,
        contactEmail: formData.contactEmail || null,
        websiteURL: formData.websiteURL || null,
        mapLink: formData.mapLink || null,
        imageUrl: formData.imageUrl || null,
      };

      const headers = {
        'Content-Type': 'application/json',
      };
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch(
        `http://localhost:3001/api/venues/${venueId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(venueData),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Notify parent component
        onVenueUpdated();

        // Go back to venues list
        onBack();
      } else {
        setError(result.message || 'Failed to update venue');
      }
    } catch (err) {
      console.error('Error updating venue:', err);
      setError('Failed to update venue');
    } finally {
      setLoading(false);
    }
  };

  // Fetch venue data and rooms on component mount
  useEffect(() => {
    if (venueId) {
      fetchVenue();
      fetchRooms();
    }
  }, [venueId]);

  // Generate presigned URL when imageUrl changes
  useEffect(() => {
    if (formData.imageUrl && sessionToken) {
      generateImageDisplayUrl(formData.imageUrl).then(setImageDisplayUrl);
    }
  }, [formData.imageUrl, sessionToken]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-400 hover:text-white transition-colors"
              title="Back to venues"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Edit Venue</h1>
              <p className="text-gray-400">Update venue information</p>
            </div>
          </div>
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
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Venue Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Venue Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter venue name"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter venue description"
              />
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter venue address"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label
                htmlFor="contactPhone"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Contact Phone
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+44 113 343 8877"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label
                htmlFor="contactEmail"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Contact Email
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@venue.com"
              />
            </div>

            {/* Website URL */}
            <div>
              <label
                htmlFor="websiteURL"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Website URL
              </label>
              <input
                type="url"
                id="websiteURL"
                name="websiteURL"
                value={formData.websiteURL}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.venue.com"
              />
            </div>

            {/* Map Link */}
            <div>
              <label
                htmlFor="mapLink"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Map Link (Optional)
              </label>
              <input
                type="url"
                id="mapLink"
                name="mapLink"
                value={formData.mapLink}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://maps.app.goo.gl/..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Google Maps or other map service link
              </p>
            </div>

            {/* Venue Image Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Venue Image (Optional)
              </label>

              {/* Current Image Display */}
              {(formData.imageUrl || imageUploadResult) && (
                <div className="relative">
                  <img
                    src={imageDisplayUrl || imageUploadResult?.url}
                    alt="Venue preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-600"
                    onError={(e) => {
                      console.log('Image failed to load. Src:', e.target.src);
                      console.log('imageDisplayUrl:', imageDisplayUrl);
                      console.log(
                        'imageUploadResult?.url:',
                        imageUploadResult?.url
                      );
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-2 transition-colors"
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
                </div>
              )}

              {/* Image Upload Section */}
              {!formData.imageUrl && !imageUploadResult && (
                <div className="space-y-3">
                  <input
                    type="file"
                    id="venue-image-input"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />

                  {selectedImage && (
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-300">
                        <strong>Selected:</strong> {selectedImage.name}
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Size:</strong>{' '}
                        {(selectedImage.size / 1024).toFixed(2)} KB
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Type:</strong> {selectedImage.type}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={!selectedImage || uploadingImage}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-400">
                Supported formats: JPG, PNG, GIF, WebP • Maximum size: 10MB
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Venue'}
              </button>
            </div>
          </form>
        </div>

        {/* Rooms Section */}
        <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Rooms</h3>
              <p className="text-gray-400 text-sm">
                Manage rooms within this venue
              </p>
            </div>
            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors"
            >
              Add Room
            </button>
          </div>

          {/* Rooms Loading */}
          {roomsLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Empty Rooms State */}
          {!roomsLoading && rooms.length === 0 && (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 text-gray-600 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                No Rooms Yet
              </h4>
              <p className="text-gray-400 mb-4">
                Add rooms to this venue to organize your events.
              </p>
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors"
              >
                Add Your First Room
              </button>
            </div>
          )}

          {/* Rooms List */}
          {!roomsLoading && rooms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.roomId}
                  className="bg-gray-700 rounded-lg border border-gray-600 p-4 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">
                      {room.roomName}
                    </h4>
                    <button
                      onClick={() => handleDeleteRoom(room.roomId)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete room"
                    >
                      <svg
                        className="h-4 w-4"
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

                  {room.description && (
                    <p className="text-gray-300 text-sm mb-3">
                      {room.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Type:</span>
                      <span className="capitalize">{room.roomType}</span>
                    </div>
                    {room.capacity > 0 && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Capacity:</span>
                        <span>{room.capacity} people</span>
                      </div>
                    )}
                    {room.amenities &&
                      Object.keys(room.amenities).length > 0 && (
                        <div>
                          <span className="font-medium mr-2">Amenities:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(room.amenities)
                              .filter(([_, value]) => value)
                              .map(([key, _]) => (
                                <span
                                  key={key}
                                  className="bg-gray-600 text-gray-200 px-2 py-1 rounded text-xs capitalize"
                                >
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Room Modal */}
        <CreateRoomModal
          isOpen={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          onRoomCreated={handleRoomCreated}
          venueId={venueId}
        />
      </div>
    </div>
  );
}

// Make EditVenuePage available globally
window.EditVenuePage = EditVenuePage;
