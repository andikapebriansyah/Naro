// debug-schema.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Define the schema in the script
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    searchMethod: {
      type: String,
      enum: ['publication', 'find_worker'],
      default: 'publication',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'menunggu', 'proses', 'completed', 'cancelled', 'disputed'],
      default: 'draft',
    },
    // Add minimal required fields
    description: String,
    category: String,
    location: String,
    scheduledDate: Date,
    scheduledTime: String,
    budget: Number,
    pricingType: { type: String, default: 'fixed' },
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

async function debugSchema() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define the model
    const Task = mongoose.model('Task', taskSchema);
    console.log('Task schema searchMethod enum:', Task.schema.path('searchMethod').enumValues);

    // Try to find existing tasks and see their searchMethod values
    const tasks = await Task.find({}).select('title searchMethod status').limit(5);
    console.log('Existing tasks:');
    tasks.forEach(task => {
      console.log(`- ${task.title}: searchMethod="${task.searchMethod}", status="${task.status}"`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugSchema();