/**
 * Script to identify and remove duplicate users by normalized email
 * Keeps the most recent active user for each email address
 */

const { dynamodb } = require('../src/dynamodb');

/**
 * Clean up duplicate users by email
 * Removes duplicates, keeping the most recent active user
 */
async function cleanupDuplicateUsers() {
  try {
    console.log('🔍 Scanning for duplicate users...');

    // Get all users
    const scanParams = {
      TableName: 'users',
      FilterExpression: 'SK = :sk',
      ExpressionAttributeValues: {
        ':sk': 'PROFILE',
      },
    };

    const result = await dynamodb.scan(scanParams).promise();
    const users = result.Items;

    console.log(`📊 Found ${users.length} users`);

    // Group users by normalized email
    const emailGroups = {};
    users.forEach((user) => {
      const email = user.email?.S?.toLowerCase();
      if (email) {
        if (!emailGroups[email]) {
          emailGroups[email] = [];
        }
        emailGroups[email].push({
          PK: user.PK?.S,
          SK: user.SK?.S,
          userId: user.userId?.S,
          name: user.name?.S,
          email: user.email?.S,
          createdAt: user.createdAt?.S,
          isActive: user.isActive?.BOOL,
        });
      }
    });

    // Find duplicates
    const duplicates = Object.entries(emailGroups).filter(
      ([email, users]) => users.length > 1
    );

    if (duplicates.length === 0) {
      console.log('✅ No duplicate users found');
      return;
    }

    console.log(
      `❌ Found ${duplicates.length} email addresses with duplicate users:`
    );

    let totalDeleted = 0;

    for (const [email, users] of duplicates) {
      console.log(`\n📧 Processing email: ${email}`);

      // Sort users: active first, then by creation date (most recent first)
      const sortedUsers = users.sort((a, b) => {
        // Active users first
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;

        // Then by creation date (most recent first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      const keepUser = sortedUsers[0];
      const deleteUsers = sortedUsers.slice(1);

      console.log(
        `   ✅ Keep: ${keepUser.userId} (${keepUser.name}) - Created: ${keepUser.createdAt} - Active: ${keepUser.isActive}`
      );

      for (const user of deleteUsers) {
        try {
          console.log(
            `   🗑️  Deleting: ${user.userId} (${user.name}) - Created: ${user.createdAt} - Active: ${user.isActive}`
          );

          // Delete the user record
          await dynamodb
            .delete({
              TableName: 'users',
              Key: {
                PK: user.PK,
                SK: user.SK,
              },
            })
            .promise();

          // Also delete any associated sessions
          const sessionScanParams = {
            TableName: 'users',
            FilterExpression:
              'userId = :userId AND begins_with(PK, :sessionPrefix)',
            ExpressionAttributeValues: {
              ':userId': user.userId,
              ':sessionPrefix': 'SESSION#',
            },
          };

          const sessionsResult = await dynamodb
            .scan(sessionScanParams)
            .promise();
          for (const session of sessionsResult.Items) {
            await dynamodb
              .delete({
                TableName: 'users',
                Key: {
                  PK: session.PK?.S,
                  SK: session.SK?.S,
                },
              })
              .promise();
            console.log(`     🗑️  Deleted session: ${session.PK?.S}`);
          }

          totalDeleted++;
        } catch (error) {
          console.error(
            `     ❌ Failed to delete user ${user.userId}:`,
            error.message
          );
        }
      }
    }

    console.log(
      `\n🎉 Cleanup completed! Deleted ${totalDeleted} duplicate users`
    );
  } catch (error) {
    console.error('❌ Error cleaning up duplicate users:', error);
    throw error;
  }
}

/**
 * Main function to run the cleanup
 */
async function main() {
  try {
    console.log('🚀 Starting duplicate user cleanup...');
    await cleanupDuplicateUsers();
    console.log('✅ Duplicate user cleanup completed');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { cleanupDuplicateUsers };
