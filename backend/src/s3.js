const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

/**
 * S3 service for handling file uploads to MinIO (S3-compatible storage)
 */
class S3Service {
  constructor() {
    // Configure AWS SDK for MinIO
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin123',
      s3ForcePathStyle: true, // Required for MinIO
      signatureVersion: 'v4',
      region: process.env.S3_REGION || 'us-east-1'
    });

    this.bucketName = process.env.S3_BUCKET || 'gameplanner-images';
  }

  /**
   * Initialize the S3 bucket if it doesn't exist
   * @returns {Promise<Object>} Result of bucket creation/verification
   */
  async initializeBucket() {
    try {
      // Check if bucket exists
      try {
        await this.s3.headBucket({ Bucket: this.bucketName }).promise();
        return {
          success: true,
          message: `Bucket '${this.bucketName}' already exists`
        };
      } catch (error) {
        if (error.statusCode === 404) {
          // Bucket doesn't exist, create it
          const params = {
            Bucket: this.bucketName,
            ACL: 'private'
          };

          await this.s3.createBucket(params).promise();
          return {
            success: true,
            message: `Bucket '${this.bucketName}' created successfully`
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('Error initializing S3 bucket:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to initialize S3 bucket'
      };
    }
  }

  /**
   * Upload a file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} contentType - MIME type
   * @param {string} folder - Optional folder path
   * @returns {Promise<Object>} Upload result with file URL
   */
  async uploadFile(fileBuffer, originalName, contentType, folder = 'uploads') {
    try {
      const fileExtension = originalName.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      const params = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'private' // Keep files private by default
      };

      const result = await this.s3.upload(params).promise();

      return {
        success: true,
        data: {
          fileName: fileName,
          originalName: originalName,
          url: result.Location,
          key: result.Key,
          bucket: this.bucketName,
          size: fileBuffer.length,
          contentType: contentType
        },
        message: 'File uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to upload file'
      };
    }
  }

  /**
   * Generate a presigned URL for file access
   * @param {string} key - S3 object key
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<Object>} Presigned URL result
   */
  async getPresignedUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);

      return {
        success: true,
        data: {
          url: url,
          key: key,
          expiresIn: expiresIn
        },
        message: 'Presigned URL generated successfully'
      };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate presigned URL'
      };
    }
  }

  /**
   * Delete a file from S3
   * @param {string} key - S3 object key
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      await this.s3.deleteObject(params).promise();

      return {
        success: true,
        message: 'File deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete file'
      };
    }
  }

  /**
   * List files in a folder
   * @param {string} prefix - Folder prefix
   * @param {number} maxKeys - Maximum number of keys to return
   * @returns {Promise<Object>} List of files
   */
  async listFiles(prefix = '', maxKeys = 1000) {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await this.s3.listObjectsV2(params).promise();

      return {
        success: true,
        data: result.Contents || [],
        message: 'Files listed successfully'
      };
    } catch (error) {
      console.error('Error listing files from S3:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to list files'
      };
    }
  }
}

module.exports = S3Service;
