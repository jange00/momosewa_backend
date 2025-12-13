import mongoose from 'mongoose';
import { User } from '../models/user.js';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';

async function seedAdmin() {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });

    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@gmail.com',
      phone: '9800000000',
      password: 'Admin@123',
      role: 'Admin',
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: Admin@123`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Admin user with this email already exists');
    }
    process.exit(1);
  }
}

seedAdmin();

