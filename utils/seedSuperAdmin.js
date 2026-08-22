require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const requiredVariables = [
  'SUPER_ADMIN_NAME',
  'SUPER_ADMIN_EMAIL',
  'SUPER_ADMIN_USERNAME',
  'SUPER_ADMIN_PASSWORD',
];

const seedSuperAdmin = async () => {
  try {
    const missingVariables = requiredVariables.filter(
      (name) => !process.env[name] || !process.env[name].trim(),
    );

    if (missingVariables.length > 0) {
      throw new Error(`Missing Super Admin environment variables: ${missingVariables.join(', ')}`);
    }

    await connectDB();

    const email = process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase();
    const username = process.env.SUPER_ADMIN_USERNAME.trim().toLowerCase();
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });

    if (existingAdmin) {
      console.log('Super Admin already exists; no changes made');
      return;
    }

    await Admin.create({
      fullName: process.env.SUPER_ADMIN_NAME.trim(),
      email,
      username,
      password: process.env.SUPER_ADMIN_PASSWORD,
      role: 'super-admin',
      status: 'active',
    });

    console.log('Super Admin created successfully');
  } catch (error) {
    console.error(`Super Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
  }
};

seedSuperAdmin();
