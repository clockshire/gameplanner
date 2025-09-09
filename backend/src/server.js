/**
 * Express server for Game Planner application
 * Handles API endpoints and serves the React application
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const { testConnection, createTableIfNotExists } = require('./dynamodb');
const { usersTableSchema } = require('./schemas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Game Planner API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../')));

// Catch all handler: send back React's index.html file for any non-API routes
app.all('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
});

/**
 * Start the server
 */
async function startServer() {
  try {
    // Test DynamoDB connection
    console.log('🔍 Testing DynamoDB connection...');
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error(
        '❌ Failed to connect to DynamoDB. Please ensure DynamoDB Local is running.'
      );
      process.exit(1);
    }

    // Create users table if it doesn't exist
    console.log('📝 Ensuring users table exists...');
    const tableCreated = await createTableIfNotExists(
      'users',
      usersTableSchema
    );

    if (!tableCreated) {
      console.error('❌ Failed to create users table');
      process.exit(1);
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Game Planner server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔧 API: http://localhost:${PORT}/api`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
