/**
 * Migration script to add createdBy field to existing events
 * This script assigns all existing events to a default user or the first available user
 */

const { dynamodb } = require('../src/dynamodb');

/**
 * Get the first available user from the users table
 * @returns {Promise<string|null>} User ID or null if no users found
 */
async function getFirstUser() {
  try {
    const params = {
      TableName: 'users',
      FilterExpression: 'SK = :sk AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':sk': 'PROFILE',
        ':isActive': true,
      },
    };

    const result = await dynamodb.scan(params).promise();

    if (result.Items && result.Items.length > 0) {
      // Sort by creation date and return the first user
      const sortedUsers = result.Items.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      return sortedUsers[0].userId;
    }

    return null;
  } catch (error) {
    console.error('Error getting first user:', error);
    return null;
  }
}

/**
 * Migrate events to add createdBy field
 */
async function migrateEvents() {
  try {
    console.log('🔄 Starting event ownership migration...');

    // Get all events without createdBy field
    const params = {
      TableName: 'events',
      FilterExpression:
        'entityType = :entityType AND attribute_not_exists(createdBy)',
      ExpressionAttributeValues: {
        ':entityType': 'EVENT',
      },
    };

    const result = await dynamodb.scan(params).promise();
    const events = result.Items || [];

    if (events.length === 0) {
      console.log('✅ No events found that need migration');
      return;
    }

    console.log(`📋 Found ${events.length} events to migrate`);

    // Get the first available user
    const userId = await getFirstUser();
    if (!userId) {
      console.error('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`👤 Assigning events to user: ${userId}`);

    // Update each event
    let successCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        const updateParams = {
          TableName: 'events',
          Key: {
            PK: event.PK,
            SK: event.SK,
          },
          UpdateExpression: 'SET createdBy = :createdBy',
          ExpressionAttributeValues: {
            ':createdBy': userId,
          },
          ConditionExpression: 'attribute_exists(PK)',
        };

        await dynamodb.update(updateParams).promise();
        console.log(`✅ Updated event: ${event.eventName}`);
        successCount++;
      } catch (error) {
        console.error(
          `❌ Failed to update event ${event.eventName}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log(`\n📊 Migration complete:`);
    console.log(`   ✅ Successfully updated: ${successCount} events`);
    console.log(`   ❌ Failed to update: ${errorCount} events`);
    console.log(`   👤 All events assigned to user: ${userId}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration results...');

    // Check events without createdBy
    const params = {
      TableName: 'events',
      FilterExpression:
        'entityType = :entityType AND attribute_not_exists(createdBy)',
      ExpressionAttributeValues: {
        ':entityType': 'EVENT',
      },
    };

    const result = await dynamodb.scan(params).promise();
    const unmigratedEvents = result.Items || [];

    if (unmigratedEvents.length === 0) {
      console.log('✅ All events have been migrated successfully');
    } else {
      console.log(
        `⚠️  ${unmigratedEvents.length} events still need migration:`
      );
      unmigratedEvents.forEach((event) => {
        console.log(`   - ${event.eventName} (${event.eventId})`);
      });
    }

    // Count total events with createdBy
    const allEventsParams = {
      TableName: 'events',
      FilterExpression:
        'entityType = :entityType AND attribute_exists(createdBy)',
      ExpressionAttributeValues: {
        ':entityType': 'EVENT',
      },
    };

    const allEventsResult = await dynamodb.scan(allEventsParams).promise();
    console.log(
      `📊 Total events with ownership: ${allEventsResult.Items.length}`
    );
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateEvents()
    .then(() => verifyMigration())
    .then(() => {
      console.log('\n🎉 Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateEvents,
  verifyMigration,
  getFirstUser,
};
