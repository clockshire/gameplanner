/**
 * Image upload component for testing S3/MinIO functionality
 */

const { useState } = React;

/**
 * ImageUpload component
 * Provides interface for testing S3/MinIO image upload functionality
 */
function ImageUpload() {
  const { sessionToken } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
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

      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !sessionToken) {
      setError('Please select a file and ensure you are logged in');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('folder', 'test-uploads');

      const response = await fetch('http://localhost:3001/api/images/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult(result.data);
        setSelectedFile(null);
        // Reset file input
        document.getElementById('file-input').value = '';
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGetPresignedUrl = async () => {
    if (!uploadResult || !sessionToken) {
      setError('No uploaded file available');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/images/presigned/${encodeURIComponent(
          uploadResult.key
        )}?expiresIn=3600`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Open the presigned URL in a new tab
        window.open(result.data.url, '_blank');
      } else {
        setError(result.message || 'Failed to generate presigned URL');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Image Upload Test</h2>

      <div className="space-y-4">
        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Image File
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="p-3 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong>File:</strong> {selectedFile.name}
            </p>
            <p className="text-sm text-gray-300">
              <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <p className="text-sm text-gray-300">
              <strong>Type:</strong> {selectedFile.type}
            </p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>

        {/* Upload Result */}
        {uploadResult && (
          <div className="p-4 bg-green-900 border border-green-700 rounded-lg">
            <h3 className="text-lg font-semibold text-green-300 mb-2">
              Upload Successful! ✅
            </h3>
            <div className="space-y-2 text-sm text-green-200">
              <p>
                <strong>File Key:</strong> {uploadResult.key}
              </p>
              <p>
                <strong>Original Name:</strong> {uploadResult.originalName}
              </p>
              <p>
                <strong>Size:</strong> {uploadResult.size} bytes
              </p>
              <p>
                <strong>Content Type:</strong> {uploadResult.contentType}
              </p>
              <p>
                <strong>Bucket:</strong> {uploadResult.bucket}
              </p>
            </div>

            <button
              onClick={handleGetPresignedUrl}
              className="mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              View Image (Presigned URL)
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Supported formats: JPG, PNG, GIF, WebP</p>
          <p>• Maximum file size: 10MB</p>
          <p>• Files are stored in MinIO S3-compatible storage</p>
          <p>
            • MinIO Console:{' '}
            <a
              href="http://localhost:9001"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              http://localhost:9001
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
