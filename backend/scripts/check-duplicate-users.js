/**
 * Script to check for duplicate users by email
 * Identifies users with the same email address
 */

const { dynamodb } = require('../src/dynamodb');

/**
 * Check for duplicate users by email
 */
async function checkDuplicateUsers() {
  try {
    console.log('🔍 Checking for duplicate users...');

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

    // Debug: Log all users
    console.log('🔍 All users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email?.S} (${user.userId?.S}) - SK: ${user.SK?.S}`);
    });

    // Group users by email
    const emailGroups = {};
    users.forEach((user) => {
      const email = user.email?.S?.toLowerCase();
      if (email) {
        if (!emailGroups[email]) {
          emailGroups[email] = [];
        }
        emailGroups[email].push({
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

    duplicates.forEach(([email, users]) => {
      console.log(`\n📧 Email: ${email}`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. User ID: ${user.userId}`);
        console.log(`     Name: ${user.name}`);
        console.log(`     Created: ${user.createdAt}`);
        console.log(`     Active: ${user.isActive}`);
      });
    });

    // Recommend which user to keep
    console.log('\n💡 Recommendations:');
    duplicates.forEach(([email, users]) => {
      // Sort by creation date (keep the first one created)
      const sortedUsers = users.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      const keepUser = sortedUsers[0];
      const deleteUsers = sortedUsers.slice(1);

      console.log(`\n📧 For ${email}:`);
      console.log(
        `   ✅ Keep: ${keepUser.userId} (${keepUser.name}) - Created: ${keepUser.createdAt}`
      );
      deleteUsers.forEach((user) => {
        console.log(
          `   ❌ Delete: ${user.userId} (${user.name}) - Created: ${user.createdAt}`
        );
      });
    });
  } catch (error) {
    console.error('❌ Error checking duplicate users:', error);
    throw error;
  }
}

/**
 * Main function to run the check
 */
async function main() {
  try {
    console.log('🚀 Starting duplicate user check...');
    await checkDuplicateUsers();
    console.log('✅ Duplicate user check completed');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { checkDuplicateUsers };
