/**
 * Script untuk mengubah role user menjadi admin
 * 
 * Cara pakai:
 * 1. Buat file ini di: scripts/set-admin.ts
 * 2. Jalankan: npx tsx scripts/set-admin.ts your-email@gmail.com
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function setAdmin(email: string) {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI tidak ditemukan di .env.local');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user
    console.log(`🔍 Mencari user dengan email: ${email}`);
    const user = await User.findOne({ email: email });

    if (!user) {
      console.error(`❌ User dengan email ${email} tidak ditemukan!`);
      console.log('\n💡 Tips: Pastikan Anda sudah login minimal 1x dengan akun Google ini');
      process.exit(1);
    }

    console.log(`✅ User ditemukan: ${user.name} (${user.email})`);
    console.log(`   Role saat ini: ${user.role}\n`);

    // Update role
    console.log('🔄 Mengubah role menjadi admin...');
    user.role = 'admin';
    await user.save();

    console.log('✅ Berhasil! Role telah diubah menjadi admin');
    console.log('\n📝 Detail User:');
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    
    console.log('\n🎉 Sekarang Anda bisa akses /admin');
    console.log('⚠️  Pastikan untuk logout dan login lagi agar session di-refresh!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email tidak diberikan');
  console.log('\nCara pakai:');
  console.log('  npx tsx scripts/set-admin.ts your-email@gmail.com');
  console.log('\nContoh:');
  console.log('  npx tsx scripts/set-admin.ts john@gmail.com');
  process.exit(1);
}

// Validate email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: Email tidak valid');
  process.exit(1);
}

// Run script
setAdmin(email);