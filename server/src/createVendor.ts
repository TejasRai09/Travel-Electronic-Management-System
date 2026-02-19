import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDb } from './mongo.js';
import { User } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

async function createVendor() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDb();
    console.log('Connected to MongoDB successfully!');
    
    const vendorEmail = 'vendor@zuari.com';
    const vendorPassword = 'Vendor@123';
    
    // Check if vendor already exists
    console.log('Checking if vendor exists...');
    const existingVendor = await User.findOne({ email: vendorEmail });
    if (existingVendor) {
      console.log('\n✅ Vendor already exists!');
      console.log('----------------------------');
      console.log('Email:', vendorEmail);
      console.log('Password:', vendorPassword);
      console.log('isVendor:', existingVendor.isVendor);
      console.log('----------------------------');
      process.exit(0);
    }
    
    console.log('Vendor does not exist. Creating...');
    
    // Hash password
    const passwordHash = await bcrypt.hash(vendorPassword, 10);
    console.log('Password hashed successfully');
    
    // Create vendor user
    const vendor = new User({
      email: vendorEmail,
      passwordHash,
      verified: true,
      isPOC: false,
      isVendor: true,
      profile: {
        employeeNumber: 'VENDOR001',
        employeeName: 'Vendor User',
        designation: 'Travel Vendor',
        email: vendorEmail,
        phone: '9876543210',
        managerEmail: '',
        managerEmployeeNo: '',
        managerEmployeeName: '',
        impactLevel: 'Low'
      }
    });
    
    console.log('Saving vendor to database...');
    await vendor.save();
    
    console.log('\n✅ Vendor created successfully!');
    console.log('----------------------------');
    console.log('Email:', vendorEmail);
    console.log('Password:', vendorPassword);
    console.log('----------------------------');
    console.log('You can now login with these credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating vendor:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

createVendor();
