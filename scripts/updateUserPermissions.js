const mongoose = require('mongoose');
const User = require('../models/User');

// Script to update all existing users with new loyalty permissions

async function updateUserPermissions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocery-pos', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    let updated = 0;
    for (const user of users) {
      // Trigger permission update by calling updatePermissions method
      user.updatePermissions(user.role);
      await user.save();
      updated++;
      console.log(`Updated permissions for ${user.firstName} ${user.lastName} (${user.role})`);
    }

    console.log(`Successfully updated ${updated} users with loyalty permissions`);
    console.log('All users now have canManageLoyalty: true permission');
    
  } catch (error) {
    console.error('Error updating user permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if this script is executed directly
if (require.main === module) {
  updateUserPermissions();
}

module.exports = updateUserPermissions;