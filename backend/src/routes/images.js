const express = require('express');
const multer = require('multer');
const S3Service = require('../s3');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();
const s3Service = new S3Service();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * Initialize S3 bucket on startup
 */
s3Service.initializeBucket().then((result) => {
  if (result.success) {
    console.log('S3 Service:', result.message);
  } else {
    console.error('S3 Service Error:', result.message);
  }
});

/**
 * POST /api/images/upload
 * Upload an image file
 */
router.post(
  '/upload',
  authenticateUser,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided',
          message: 'Please select an image file to upload',
        });
      }

      const { folder = 'uploads' } = req.body;

      const result = await s3Service.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        folder
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to upload image',
      });
    }
  }
);

/**
 * GET /api/images/presigned/:key
 * Get a presigned URL for accessing an image
 */
router.get('/presigned/:key', authenticateUser, async (req, res) => {
  try {
    const { key } = req.params;
    const { expiresIn = 3600 } = req.query;

    const result = await s3Service.getPresignedUrl(key, parseInt(expiresIn));

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate presigned URL',
    });
  }
});

/**
 * DELETE /api/images/:key
 * Delete an image file
 */
router.delete('/:key', authenticateUser, async (req, res) => {
  try {
    const { key } = req.params;

    const result = await s3Service.deleteFile(key);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete image',
    });
  }
});

/**
 * GET /api/images/list
 * List images in a folder
 */
router.get('/list', authenticateUser, async (req, res) => {
  try {
    const { prefix = '', maxKeys = 100 } = req.query;

    const result = await s3Service.listFiles(prefix, parseInt(maxKeys));

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Image listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to list images',
    });
  }
});

module.exports = router;
