/**
 * DynamoDB table schemas for Game Planner application
 * Defines the structure of all tables used in the application
 */

/**
 * Users table schema
 * Stores user profiles and authentication data
 */
const usersTableSchema = {
  TableName: 'users',
  KeySchema: [
    {
      AttributeName: 'PK',
      KeyType: 'HASH', // Partition key
    },
    {
      AttributeName: 'SK',
      KeyType: 'RANGE', // Sort key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'PK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'SK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'email',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'eventId',
      AttributeType: 'S', // String
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'EmailIndex',
      KeySchema: [
        {
          AttributeName: 'email',
          KeyType: 'HASH',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
    {
      IndexName: 'EventIdIndex',
      KeySchema: [
        {
          AttributeName: 'eventId',
          KeyType: 'HASH',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

/**
 * Events table schema
 * Stores event information and details
 */
const eventsTableSchema = {
  TableName: 'events',
  KeySchema: [
    {
      AttributeName: 'PK',
      KeyType: 'HASH', // Partition key
    },
    {
      AttributeName: 'SK',
      KeyType: 'RANGE', // Sort key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'PK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'SK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'eventDate',
      AttributeType: 'S', // String (ISO date)
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'EventDateIndex',
      KeySchema: [
        {
          AttributeName: 'eventDate',
          KeyType: 'HASH',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

/**
 * Venues table schema
 * Stores venue information and details
 */
const venuesTableSchema = {
  TableName: 'venues',
  KeySchema: [
    {
      AttributeName: 'PK',
      KeyType: 'HASH', // Partition key
    },
    {
      AttributeName: 'SK',
      KeyType: 'RANGE', // Sort key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'PK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'SK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'venueName',
      AttributeType: 'S', // String
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'VenueNameIndex',
      KeySchema: [
        {
          AttributeName: 'venueName',
          KeyType: 'HASH',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

/**
 * Rooms table schema
 * Stores room information and availability
 * Now includes venue reference
 */
const roomsTableSchema = {
  TableName: 'rooms',
  KeySchema: [
    {
      AttributeName: 'PK',
      KeyType: 'HASH', // Partition key
    },
    {
      AttributeName: 'SK',
      KeyType: 'RANGE', // Sort key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'PK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'SK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'venueId',
      AttributeType: 'S', // String
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'VenueRoomsIndex',
      KeySchema: [
        {
          AttributeName: 'venueId',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'SK',
          KeyType: 'RANGE',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

/**
 * Games table schema
 * Stores game catalog and information
 */
const gamesTableSchema = {
  TableName: 'games',
  KeySchema: [
    {
      AttributeName: 'PK',
      KeyType: 'HASH', // Partition key
    },
    {
      AttributeName: 'SK',
      KeyType: 'RANGE', // Sort key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'PK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'SK',
      AttributeType: 'S', // String
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

/**
 * Bookings table schema
 * Stores user bookings and room assignments
 */
const bookingsTableSchema = {
  TableName: 'bookings',
  KeySchema: [
    {
      AttributeName: 'PK',
      KeyType: 'HASH', // Partition key
    },
    {
      AttributeName: 'SK',
      KeyType: 'RANGE', // Sort key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'PK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'SK',
      AttributeType: 'S', // String
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

/**
 * Invitations table schema
 * Stores event invitation codes and their usage
 */
const invitationsTableSchema = {
  TableName: 'invitations',
  KeySchema: [
    {
      AttributeName: 'PK',
      KeyType: 'HASH', // Partition key
    },
    {
      AttributeName: 'SK',
      KeyType: 'RANGE', // Sort key
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: 'PK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'SK',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'inviteCode',
      AttributeType: 'S', // String
    },
    {
      AttributeName: 'invitedEventId',
      AttributeType: 'S', // String
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'InviteCodeIndex',
      KeySchema: [
        {
          AttributeName: 'inviteCode',
          KeyType: 'HASH',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
    {
      IndexName: 'EventInvitesIndex',
      KeySchema: [
        {
          AttributeName: 'invitedEventId',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'SK',
          KeyType: 'RANGE',
        },
      ],
      Projection: {
        ProjectionType: 'ALL',
      },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

module.exports = {
  usersTableSchema,
  eventsTableSchema,
  venuesTableSchema,
  roomsTableSchema,
  gamesTableSchema,
  bookingsTableSchema,
  invitationsTableSchema,
};
