/**
 * Environment configuration for Game Planner application
 * Handles local development vs production environment settings
 */

const config = {
  development: {
    dynamodb: {
      endpoint: 'http://localhost:8000',
      region: 'us-east-1',
      accessKeyId: 'dummy',
      secretAccessKey: 'dummy',
    },
    app: {
      name: 'Game Planner',
      version: '1.0.0',
      port: 3000,
    },
  },

  production: {
    dynamodb: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    app: {
      name: 'Game Planner',
      version: '1.0.0',
      port: process.env.PORT || 3000,
    },
  },
};

const environment = process.env.NODE_ENV || 'development';

module.exports = config[environment];
