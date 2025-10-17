require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Simple User Schema (tanpa mengimport model)
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  isVerified: Boolean,
});

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Error: Email is required');
      console.log('\nUsage:');
      console.log('  node scripts/create-admin.js <email>');
      console.log('\nExample:');
      console.log('  node scripts/create-admin.js admin@naro.com');
      process.exit(1);
    }

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (!existingUser) {
      console.error(`❌ User with email "${email}" not found`);
      console.log('\nTips:');
      console.log('1. Make sure the user has logged in at least once');
      console.log('2. Check if the email is correct');
      console.log('3. Login to the app first, then run this script');
      process.exit(1);
    }

    // Check current role
    console.log('📋 Current user details:');
    console.log(`   Email: ${existingUser.email}`);
    console.log(`   Name: ${existingUser.name}`);
    console.log(`   Current Role: ${existingUser.role || 'user'}`);
    console.log(`   Verified: ${existingUser.isVerified || false}\n`);

    if (existingUser.role === 'admin') {
      console.log('ℹ️  User is already an admin. No changes needed.');
      process.exit(0);
    }

    // Update to admin
    console.log('🔄 Updating user to admin...');
    
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { 
        $set: { 
          role: 'admin',
          // Optional: auto-verify admin users
          // isVerified: true 
        }
      },
      { new: true }
    );

    if (updatedUser) {
      console.log('✅ User successfully upgraded to admin!\n');
      console.log('📋 Updated user details:');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Name: ${updatedUser.name}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Verified: ${updatedUser.isVerified || false}\n`);
      console.log('🎉 Done! You can now login and access /admin');
    } else {
      console.error('❌ Failed to update user');
      process.exit(1);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

createAdmin();