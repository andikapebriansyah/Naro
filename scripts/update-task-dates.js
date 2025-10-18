const { MongoClient, ObjectId } = require('mongodb');

async function updateTaskCompletionDates() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/naro';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const tasksCollection = db.collection('tasks');

    // Find completed tasks
    const completedTasks = await tasksCollection.find({
      status: { $in: ['completed', 'selesai'] }
    }).toArray();

    console.log(`📋 Found ${completedTasks.length} completed tasks`);

    let updatedCount = 0;
    const now = new Date();

    for (let i = 0; i < completedTasks.length; i++) {
      const task = completedTasks[i];
      
      // Create varied completion dates (last 60 days)
      const daysAgo = Math.floor(Math.random() * 60) + 1; // 1-60 days ago
      const hoursAgo = Math.floor(Math.random() * 24); // 0-23 hours
      const minutesAgo = Math.floor(Math.random() * 60); // 0-59 minutes
      
      const completedAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
      
      // Update the task with varied completion date
      await tasksCollection.updateOne(
        { _id: task._id },
        {
          $set: {
            completedAt: completedAt,
            employerCompletedAt: completedAt,
            workerCompletedAt: new Date(completedAt.getTime() - (2 * 60 * 60 * 1000)), // 2 hours earlier
            updatedAt: completedAt
          }
        }
      );

      console.log(`✅ Updated task "${task.title}" - completed ${daysAgo} days ago (${completedAt.toLocaleDateString('id-ID')})`);
      updatedCount++;
    }

    console.log(`\n🎉 Updated completion dates for ${updatedCount} tasks!`);

    // Also update review dates to match task completion dates
    const reviewsCollection = db.collection('reviews');
    const reviews = await reviewsCollection.find({}).toArray();
    
    console.log(`\n📝 Found ${reviews.length} reviews to update...`);

    for (const review of reviews) {
      const task = await tasksCollection.findOne({ _id: review.taskId });
      if (task && task.completedAt) {
        // Set review date 1-3 days after task completion
        const reviewDate = new Date(task.completedAt.getTime() + (Math.floor(Math.random() * 3) + 1) * 24 * 60 * 60 * 1000);
        
        await reviewsCollection.updateOne(
          { _id: review._id },
          {
            $set: {
              createdAt: reviewDate,
              updatedAt: reviewDate
            }
          }
        );
        
        console.log(`✅ Updated review date for task "${task.title}"`);
      }
    }

    console.log(`\n🎉 All dates updated successfully!`);

  } catch (error) {
    console.error('❌ Error updating completion dates:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  updateTaskCompletionDates();
}

module.exports = { updateTaskCompletionDates };