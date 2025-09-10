/**
 * Script to update existing events with createdBy field
 * Assigns all existing events to the specified user
 */

const { dynamodb } = require('../src/dynamodb');

/**
 * Update all existing events to assign them to a specific user
 * @param {string} userId - User ID to assign all events to
 */
async function updateEventsWithCreatedBy(userId) {
  try {
    console.log(`🔄 Updating all events to assign them to user: ${userId}`);

    // First, get all events
    const scanParams = {
      TableName: 'events',
      FilterExpression: 'attribute_exists(eventId)',
    };

    const result = await dynamodb.scan(scanParams).promise();
    const events = result.Items;

    console.log(`📊 Found ${events.length} events to update`);

    if (events.length === 0) {
      console.log('✅ No events found to update');
      return;
    }

    // Update each event
    let updatedCount = 0;
    for (const event of events) {
      try {
        const updateParams = {
          TableName: 'events',
          Key: {
            PK: event.PK,
            SK: event.SK,
          },
          UpdateExpression:
            'SET createdBy = :createdBy, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':createdBy': userId,
            ':updatedAt': new Date().toISOString(),
          },
          ConditionExpression: 'attribute_exists(PK)', // Ensure event exists
        };

        await dynamodb.update(updateParams).promise();
        updatedCount++;
        console.log(`✅ Updated event: ${event.eventName?.S || 'Unknown'}`);
      } catch (error) {
        console.error(
          `❌ Failed to update event ${event.PK?.S}:`,
          error.message
        );
      }
    }

    console.log(
      `🎉 Successfully updated ${updatedCount} out of ${events.length} events`
    );
  } catch (error) {
    console.error('❌ Error updating events:', error);
    throw error;
  }
}

/**
 * Main function to run the update
 */
async function main() {
  try {
    // Get the user ID from command line arguments
    const userId = process.argv[2];

    if (!userId) {
      console.error('❌ Please provide a user ID as an argument');
      console.log('Usage: node update-events-createdby.js <userId>');
      console.log(
        'Example: node update-events-createdby.js a6f3aec2-7d19-48d5-85a4-7602da37e79f'
      );
      process.exit(1);
    }

    console.log('🚀 Starting event update process...');
    await updateEventsWithCreatedBy(userId);
    console.log('✅ Event update process completed');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { updateEventsWithCreatedBy };
