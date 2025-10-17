// check-users.js
// Run with: node check-users.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  image: String,
  role: { type: String, enum: ['user', 'tasker', 'admin'], default: 'user' },
  phone: String,
  location: String,
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  about: String,
  workCategories: [{ type: String, enum: ['kebersihan', 'teknisi', 'renovasi', 'tukang', 'angkut', 'taman', 'lainnya'] }],
  profileComplete: { type: Boolean, default: false },
  ktpVerification: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    ktpImage: String,
    selfieImage: String,
    ktpNumber: String,
    fullName: String,
    dateOfBirth: String,
    address: String,
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: Date,
    rejectionReason: String,
  },
  paymentMethod: {
    type: { type: String, enum: ['bank', 'ewallet'] },
    bankName: String,
    accountNumber: String,
    accountName: String,
    ewalletType: { type: String, enum: ['gopay', 'ovo', 'dana', 'shopeepay'] },
    ewalletNumber: String,
  },
}, { timestamps: true });

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    const User = mongoose.model('User', userSchema);
    
    // Check all users
    const users = await User.find({});
    console.log(`\nFound ${users.length} users in database:`);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Profile Complete: ${user.profileComplete}`);
      });
    } else {
      console.log('No users found in database.');
    }

    // Check NextAuth collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });

    // Check accounts collection (NextAuth)
    try {
      const accounts = await mongoose.connection.db.collection('accounts').find({}).toArray();
      console.log(`\nFound ${accounts.length} OAuth accounts:`);
      accounts.forEach((account, index) => {
        console.log(`\n${index + 1}. Account:`);
        console.log(`   Provider: ${account.provider}`);
        console.log(`   User ID: ${account.userId}`);
        console.log(`   Provider Account ID: ${account.providerAccountId}`);
      });
    } catch (error) {
      console.log('\nNo accounts collection found');
    }

    await mongoose.connection.close();
    console.log('\nConnection closed.');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();