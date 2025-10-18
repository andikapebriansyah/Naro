// Script untuk menambahkan field baru ke existing users
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('🔄 Migrating user fields...');

    // Update all users to have the new fields
    const result = await usersCollection.updateMany(
      {},
      {
        $set: {
          phoneVerified: false,
          totalEarnings: 0,
        },
        $setOnInsert: {
          balance: 0,
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);

    // Calculate and update totalEarnings for workers who have completed tasks
    console.log('🔄 Calculating totalEarnings for workers...');
    
    const tasksCollection = db.collection('tasks');
    const users = await usersCollection.find({}).toArray();

    let updatedWorkers = 0;
    for (const user of users) {
      // Find all completed tasks for this worker
      const completedTasks = await tasksCollection.find({
        assignedTo: user._id,
        status: { $in: ['completed', 'selesai'] }
      }).toArray();

      if (completedTasks.length > 0) {
        // Calculate total earnings
        const totalEarnings = completedTasks.reduce((sum, task) => {
          return sum + (task.budget || 0);
        }, 0);

        // Update user's totalEarnings
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { totalEarnings } }
        );

        updatedWorkers++;
        console.log(`  ✓ User ${user.name}: ${completedTasks.length} tasks, Rp ${totalEarnings.toLocaleString('id-ID')}`);
      }
    }

    console.log(`✅ Updated totalEarnings for ${updatedWorkers} workers`);
    console.log('🎉 Migration completed successfully!');

    await mongoose.connection.close();
    console.log('👋 Connection closed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers();