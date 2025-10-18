const { MongoClient } = require('mongodb');

async function syncTotalEarnings() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/naro';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const tasksCollection = db.collection('tasks');
    const usersCollection = db.collection('users');

    // Find all users who have worked on completed tasks
    const completedTasks = await tasksCollection.find({
      status: { $in: ['completed', 'selesai'] },
      assignedTo: { $exists: true, $ne: null },
      budget: { $exists: true, $gt: 0 }
    }).toArray();

    console.log(`📋 Found ${completedTasks.length} completed tasks with payment`);

    // Group tasks by worker
    const workerEarnings = {};
    
    for (const task of completedTasks) {
      const workerId = task.assignedTo.toString();
      if (!workerEarnings[workerId]) {
        workerEarnings[workerId] = {
          totalEarnings: 0,
          completedTasks: 0,
          tasks: []
        };
      }
      workerEarnings[workerId].totalEarnings += task.budget;
      workerEarnings[workerId].completedTasks += 1;
      workerEarnings[workerId].tasks.push({
        title: task.title,
        budget: task.budget,
        completedAt: task.completedAt || task.updatedAt
      });
    }

    console.log(`👷 Found ${Object.keys(workerEarnings).length} workers with earnings`);

    // Update each worker's totalEarnings
    let updatedCount = 0;
    for (const [workerId, earnings] of Object.entries(workerEarnings)) {
      const { ObjectId } = require('mongodb');
      
      const currentUser = await usersCollection.findOne({ _id: new ObjectId(workerId) });
      if (!currentUser) {
        console.log(`❌ Worker ${workerId} not found`);
        continue;
      }

      const currentTotalEarnings = currentUser.totalEarnings || 0;
      const calculatedEarnings = earnings.totalEarnings;

      if (currentTotalEarnings !== calculatedEarnings) {
        await usersCollection.updateOne(
          { _id: new ObjectId(workerId) },
          {
            $set: {
              totalEarnings: calculatedEarnings,
              completedTasks: earnings.completedTasks
            }
          }
        );

        console.log(`✅ Updated ${currentUser.name}:`);
        console.log(`  - Total Earnings: ${currentTotalEarnings.toLocaleString('id-ID')} → ${calculatedEarnings.toLocaleString('id-ID')}`);
        console.log(`  - Completed Tasks: ${earnings.completedTasks}`);
        console.log(`  - Tasks:`, earnings.tasks.map(t => `${t.title} (${t.budget.toLocaleString('id-ID')})`));
        updatedCount++;
      } else {
        console.log(`✓ ${currentUser.name} already has correct totalEarnings: ${calculatedEarnings.toLocaleString('id-ID')}`);
      }
    }

    console.log(`\n🎉 Sync completed! Updated ${updatedCount} workers.`);

  } catch (error) {
    console.error('❌ Error syncing total earnings:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  syncTotalEarnings();
}

module.exports = { syncTotalEarnings };