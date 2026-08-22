require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Role = require('../models/Role');
const { ROLE_PERMISSIONS } = require('../constants/rolePermissions');

const roleDetails = {
  'super-admin': {
    displayName: 'Super Admin',
    description: 'Full system access.',
  },
  'management-admin': {
    displayName: 'Management Admin',
    description: 'Member, application, content, document, and committee management.',
  },
  'finance-admin': {
    displayName: 'Finance Admin',
    description: 'Finance operations and related document access.',
  },
  'content-admin': {
    displayName: 'Content Admin',
    description: 'Activities, news, gallery, and basic document access.',
  },
};

const seedRoles = async () => {
  try {
    await connectDB();

    const operations = Object.entries(ROLE_PERMISSIONS).map(([name, permissions]) => ({
      updateOne: {
        filter: { name },
        update: {
          $set: {
            ...roleDetails[name],
            permissions,
            isActive: true,
          },
          $setOnInsert: { name, isSystem: true },
        },
        upsert: true,
      },
    }));

    await Role.bulkWrite(operations);
    const systemRoleCount = await Role.countDocuments({
      name: { $in: Object.keys(ROLE_PERMISSIONS) },
      isSystem: true,
    });

    if (systemRoleCount !== operations.length) {
      throw new Error('Default role verification failed');
    }

    console.log(`Default roles synchronized successfully (${systemRoleCount})`);
  } catch (error) {
    console.error(`Role seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
  }
};

seedRoles();
