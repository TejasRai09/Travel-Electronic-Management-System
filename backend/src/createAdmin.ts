import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDb } from './mongo.js';
import { User, Employee } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDb();
    console.log('Connected to MongoDB');
    
    const adminEmail = 'admin@adventz.com';
    const adminPassword = 'Admin@123456';
    
    // Check if admin already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      // Update existing user to be admin
      existingUser.isAdmin = true;
      await existingUser.save();
      
      console.log('\n✅ Existing user updated with Admin privileges');
      console.log('===========================================');
      console.log('Admin User Updated Successfully!');
      console.log('===========================================');
      console.log('Email:    ', adminEmail);
      console.log('Password: ', adminPassword);
      console.log('Role:     ', 'Admin (Full System Access)');
      console.log('===========================================');
      console.log('\nYou can now log in with these credentials.');
      console.log('The Admin Dashboard will be visible in the sidebar.\n');
      process.exit(0);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Create/update employee record
    await Employee.findOneAndUpdate(
      { email: adminEmail },
      {
        employeeNumber: 'ADMIN001',
        employeeName: 'System Administrator',
        designation: 'System Admin',
        email: adminEmail,
        phone: '9999999999',
        managerEmail: '',
        managerEmployeeNo: '',
        managerEmployeeName: '',
        impactLevel: 'Admin'
      },
      { upsert: true }
    );
    console.log('✓ Employee record created/updated:', adminEmail);
    
    // Create admin user
    const admin = new User({
      email: adminEmail,
      passwordHash,
      verified: true,
      isPOC: false,
      isVendor: false,
      isAdmin: true,
      profile: {
        employeeNumber: 'ADMIN001',
        employeeName: 'System Administrator',
        designation: 'System Admin',
        email: adminEmail,
        phone: '9999999999',
        managerEmail: '',
        managerEmployeeNo: '',
        managerEmployeeName: '',
        impactLevel: 'Admin'
      }
    });
    
    await admin.save();
    console.log('✓ Admin user created\n');
    
    console.log('===========================================');
    console.log('Admin User Created Successfully!');
    console.log('===========================================');
    console.log('Email:    ', adminEmail);
    console.log('Password: ', adminPassword);
    console.log('Role:     ', 'Admin (Full System Access)');
    console.log('===========================================');
    console.log('\nYou can now log in with these credentials.');
    console.log('The Admin Dashboard will be visible in the sidebar.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
