import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

import { connectDb } from './mongo.js';
import { Employee, User } from './models.js';

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Load server/.env
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
  dotenv.config();

  await connectDb();

  const pocEmail = 'poc@adventz.com';
  const pocPassword = 'poc123456';
  const pocName = 'Travel POC';

  // 1. Create/Update Employee record
  const employee = await Employee.findOneAndUpdate(
    { email: pocEmail },
    {
      employeeNumber: 'POC001',
      employeeName: pocName,
      designation: 'Travel Point of Contact',
      email: pocEmail,
      phone: '+91 9999999999',
      managerEmail: '',
      managerEmployeeNo: '',
      managerEmployeeName: '',
      impactLevel: 'High',
      isManager: false
    },
    { upsert: true, new: true }
  );

  console.log('✓ Employee record created/updated:', employee.email);

  // 2. Create/Update User account with POC flag
  const existingUser = await User.findOne({ email: pocEmail });
  
  if (existingUser) {
    existingUser.isPOC = true;
    await existingUser.save();
    console.log('✓ Existing user updated with POC privileges');
  } else {
    const passwordHash = await bcrypt.hash(pocPassword, 10);
    
    const newUser = await User.create({
      email: pocEmail,
      passwordHash,
      verified: true,
      isPOC: true,
      profile: {}
    });
    
    console.log('✓ New POC user created');
  }

  console.log('\n===========================================');
  console.log('POC User Created Successfully!');
  console.log('===========================================');
  console.log(`Email:    ${pocEmail}`);
  console.log(`Password: ${pocPassword}`);
  console.log('Role:     POC (Point of Contact)');
  console.log('===========================================\n');
  console.log('You can now log in with these credentials.');
  console.log('The POC Dashboard will be visible in the sidebar.');

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create POC user:', err);
  process.exit(1);
});
