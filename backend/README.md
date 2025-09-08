# Game Planner Backend Setup

This directory contains the backend configuration and scripts for the Game
Planner application using DynamoDB.

## Local Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js (v16 or higher)
- AWS CLI (optional, for advanced operations)

### Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start DynamoDB Local:**

   ```bash
   npm run dynamodb:start
   ```

3. **Setup local tables:**

   ```bash
   npm run dynamodb:setup
   ```

4. **Verify setup:**

   ```bash
   npm run dynamodb:status
   ```

### Available Scripts

- `npm run dynamodb:start` - Start DynamoDB Local in Docker
- `npm run dynamodb:stop` - Stop DynamoDB Local
- `npm run dynamodb:setup` - Create all necessary tables
- `npm run dynamodb:status` - Check DynamoDB Local status

### Environment Configuration

The application automatically detects the environment:

- **Local Development**: Uses DynamoDB Local on `localhost:8000`
- **Production**: Uses AWS DynamoDB with environment variables

### Table Structure

The following tables are created for local development:

- **users** - User profiles and authentication
- **events** - Event information and scheduling
- **rooms** - Room management and availability
- **games** - Game catalog and information
- **bookings** - User bookings and room assignments

### Testing the Setup

You can test the setup by running the setup script:

```bash
node backend/scripts/setup-local.js
```

This will:

1. Test the DynamoDB connection
2. Create all necessary tables
3. Verify the setup is working

### Troubleshooting

**DynamoDB Local not starting:**

- Make sure Docker is running
- Check if port 8000 is available
- Run `docker-compose logs dynamodb-local` for error details

**Connection issues:**

- Verify DynamoDB Local is running on `localhost:8000`
- Check the environment configuration in `backend/config/environment.js`

**Table creation fails:**

- Ensure DynamoDB Local is fully started before running setup
- Check AWS credentials are set to dummy values for local development
