const { MongoClient, ObjectId } = require('mongodb');

async function createSampleReviews() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/naro';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const tasksCollection = db.collection('tasks');
    const usersCollection = db.collection('users');
    const reviewsCollection = db.collection('reviews');

    // Find completed tasks with assigned workers
    const completedTasks = await tasksCollection.find({
      status: { $in: ['completed', 'selesai'] },
      assignedTo: { $exists: true, $ne: null },
      posterId: { $exists: true, $ne: null }
    }).toArray();

    console.log(`📋 Found ${completedTasks.length} completed tasks`);

    if (completedTasks.length === 0) {
      console.log('❌ No completed tasks found to create reviews for');
      return;
    }

    // Sample review comments
    const sampleComments = [
      "Pekerjaan dilakukan dengan sangat baik dan sesuai instruksi. Pekerja sangat professional dan tepat waktu.",
      "Hasil kerja memuaskan, komunikasi lancar, dan penyelesaian tepat waktu. Akan menggunakan jasa lagi.",
      "Kerja bagus, rapi, dan bersih. Pekerja ramah dan mudah diajak diskusi. Sangat recommended!",
      "Professional dalam bekerja, hasil sesuai ekspektasi. Komunikasi baik dan responsif.",
      "Pekerjaan selesai dengan baik, meskipun ada sedikit keterlambatan. Overall satisfied.",
      "Excellent work! Pekerja sangat detail dan teliti. Hasil melebihi ekspektasi.",
      "Good job! Komunikasi lancar, kerja cepat dan bersih. Will hire again for sure.",
      "Pekerjaan bagus, sesuai deadline, dan harga reasonable. Terima kasih!",
      "Sangat puas dengan hasilnya. Pekerja experienced dan tahu apa yang harus dilakukan.",
      "Great service! Punctual, professional, dan hasil kerja rapi. Highly recommended."
    ];

    const sampleRatings = [5, 5, 4, 5, 4, 5, 5, 4, 4, 5]; // Mostly good ratings

    let reviewsCreated = 0;

    for (let i = 0; i < Math.min(completedTasks.length, 10); i++) {
      const task = completedTasks[i];
      
      // Check if review already exists
      const existingReview = await reviewsCollection.findOne({
        taskId: task._id,
        fromUserId: task.posterId
      });

      if (existingReview) {
        console.log(`⏭️  Review already exists for task: ${task.title}`);
        continue;
      }

      // Create review from employer to worker
      const review = {
        taskId: task._id,
        fromUserId: task.posterId,
        toUserId: task.assignedTo,
        rating: sampleRatings[i % sampleRatings.length],
        comment: sampleComments[i % sampleComments.length],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        updatedAt: new Date()
      };

      await reviewsCollection.insertOne(review);
      reviewsCreated++;

      console.log(`✅ Created review for task: ${task.title} (Rating: ${review.rating}/5)`);
    }

    console.log(`\n🎉 Created ${reviewsCreated} sample reviews!`);

    // Show summary stats
    const allReviews = await reviewsCollection.find({}).toArray();
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    console.log(`\n📊 Review Summary:`);
    console.log(`   Total Reviews: ${allReviews.length}`);
    console.log(`   Average Rating: ${avgRating.toFixed(1)}/5`);
    
    // Rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach(r => distribution[r.rating]++);
    console.log(`   Distribution:`, distribution);

  } catch (error) {
    console.error('❌ Error creating sample reviews:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  createSampleReviews();
}

module.exports = { createSampleReviews };