/**
 * Create Venue Modal Component
 * Modal for creating new venues
 */

const { useState } = React;

/**
 * CreateVenueModal component
 * Handles venue creation with form validation
 */
function CreateVenueModal({ isOpen, onClose, onVenueCreated }) {
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadResult, setImageUploadResult] = useState(null);
  const [imageDisplayUrl, setImageDisplayUrl] = useState(null);

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
        document.getElementById('create-venue-image-input').value = '';
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
    const fileInput = document.getElementById('create-venue-image-input');
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

      const response = await fetch('http://localhost:3001/api/venues', {
        method: 'POST',
        headers,
        body: JSON.stringify(venueData),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          address: '',
          contactPhone: '',
          contactEmail: '',
          websiteURL: '',
          mapLink: '',
        });

        // Notify parent component
        onVenueCreated();

        // Close modal
        onClose();
      } else {
        setError(result.message || 'Failed to create venue');
      }
    } catch (err) {
      console.error('Error creating venue:', err);
      setError('Failed to create venue');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setError(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      contactInfo: '',
      capacity: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Add New Venue</h2>
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
                  <h3 className="text-sm font-medium">Error creating venue</h3>
                  <div className="mt-2 text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
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
                    id="create-venue-image-input"
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
                onClick={handleClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Venue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Make CreateVenueModal available globally
window.CreateVenueModal = CreateVenueModal;
