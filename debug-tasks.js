const { MongoClient } = require('mongodb');

async function debugTasks() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/naro');
  
  try {
    await client.connect();
    const db = client.db();
    const tasks = db.collection('tasks');
    
    // Find find_worker tasks
    const findWorkerTasks = await tasks.find({
      searchMethod: 'find_worker'
    }).limit(5).toArray();
    
    console.log('=== FIND_WORKER TASKS ===');
    findWorkerTasks.forEach((task, index) => {
      console.log(`Task ${index + 1}:`);
      console.log('- ID:', task._id);
      console.log('- Title:', task.title);
      console.log('- Status:', task.status);
      console.log('- SearchMethod:', task.searchMethod);
      console.log('- AssignedTo:', task.assignedTo);
      console.log('- PosterId:', task.posterId);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugTasks();