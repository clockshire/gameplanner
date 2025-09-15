/**
 * Migration script to add createdBy field to existing venues
 * This script assigns all existing venues to a default user or the first available user
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
 * Migrate venues to add createdBy field
 */
async function migrateVenues() {
  try {
    console.log('🔄 Starting venue ownership migration...');

    // Get all venues without createdBy field
    const params = {
      TableName: 'venues',
      FilterExpression:
        'entityType = :entityType AND attribute_not_exists(createdBy)',
      ExpressionAttributeValues: {
        ':entityType': 'VENUE',
      },
    };

    const result = await dynamodb.scan(params).promise();
    const venues = result.Items || [];

    if (venues.length === 0) {
      console.log('✅ No venues found that need migration');
      return;
    }

    console.log(`📋 Found ${venues.length} venues to migrate`);

    // Get the first available user
    const userId = await getFirstUser();
    if (!userId) {
      console.error('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`👤 Assigning venues to user: ${userId}`);

    // Update each venue
    let successCount = 0;
    let errorCount = 0;

    for (const venue of venues) {
      try {
        const updateParams = {
          TableName: 'venues',
          Key: {
            PK: venue.PK,
            SK: venue.SK,
          },
          UpdateExpression: 'SET createdBy = :createdBy',
          ExpressionAttributeValues: {
            ':createdBy': userId,
          },
          ConditionExpression: 'attribute_exists(PK)',
        };

        await dynamodb.update(updateParams).promise();
        console.log(`✅ Updated venue: ${venue.venueName}`);
        successCount++;
      } catch (error) {
        console.error(
          `❌ Failed to update venue ${venue.venueName}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log(`\n📊 Migration complete:`);
    console.log(`   ✅ Successfully updated: ${successCount} venues`);
    console.log(`   ❌ Failed to update: ${errorCount} venues`);
    console.log(`   👤 All venues assigned to user: ${userId}`);
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

    // Check venues without createdBy
    const params = {
      TableName: 'venues',
      FilterExpression:
        'entityType = :entityType AND attribute_not_exists(createdBy)',
      ExpressionAttributeValues: {
        ':entityType': 'VENUE',
      },
    };

    const result = await dynamodb.scan(params).promise();
    const unmigratedVenues = result.Items || [];

    if (unmigratedVenues.length === 0) {
      console.log('✅ All venues have been migrated successfully');
    } else {
      console.log(
        `⚠️  ${unmigratedVenues.length} venues still need migration:`
      );
      unmigratedVenues.forEach((venue) => {
        console.log(`   - ${venue.venueName} (${venue.venueId})`);
      });
    }

    // Count total venues with createdBy
    const allVenuesParams = {
      TableName: 'venues',
      FilterExpression:
        'entityType = :entityType AND attribute_exists(createdBy)',
      ExpressionAttributeValues: {
        ':entityType': 'VENUE',
      },
    };

    const allVenuesResult = await dynamodb.scan(allVenuesParams).promise();
    console.log(
      `📊 Total venues with ownership: ${allVenuesResult.Items.length}`
    );
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateVenues()
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
  migrateVenues,
  verifyMigration,
  getFirstUser,
};
