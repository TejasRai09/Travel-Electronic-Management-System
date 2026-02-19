import XLSX from 'xlsx';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Travel';

// Employee Schema
const employeeSchema = new mongoose.Schema({
  employeeNumber: { type: String, required: true },
  employeeName: { type: String, required: true },
  designation: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  managerEmail: { type: String, lowercase: true },
  managerEmployeeNo: { type: String },
  managerEmployeeName: { type: String },
  impactLevel: { type: String }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

// Helper functions
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeString(value) {
  return String(value ?? '').trim();
}

function readHeader(row, header) {
  // Try exact match first
  if (row[header] !== undefined) return row[header];
  
  // Try case-insensitive match
  const wanted = header.trim().toLowerCase();
  const foundKey = Object.keys(row).find((k) => k.trim().toLowerCase() === wanted);
  return foundKey ? row[foundKey] : undefined;
}

async function importEmployees() {
  try {
    console.log('🚀 Starting employee import...\n');
    
    // Connect to MongoDB
    console.log(`📡 Connecting to MongoDB: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Read Excel file
    const excelPath = path.join(__dirname, 'Book20.xlsx');
    console.log(`📂 Reading Excel file: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw new Error('No sheets found in Excel file');
    }
    
    console.log(`📊 Reading sheet: "${sheetName}"\n`);
    
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    console.log(`📋 Found ${rows.length} rows in Excel file\n`);
    console.log('⏳ Processing employees...\n');

    let upserted = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const employeeNumber = normalizeString(readHeader(row, 'Employee Number'));
        const employeeName = normalizeString(readHeader(row, 'Employee Name'));
        const designation = normalizeString(readHeader(row, 'Curr.Designation'));
        const email = normalizeEmail(readHeader(row, 'Email'));
        const phone = normalizeString(readHeader(row, 'Phone'));
        const managerEmail = normalizeEmail(readHeader(row, 'Manager Email Id'));
        const managerEmployeeNo = normalizeString(readHeader(row, 'Manager Employee No'));
        const managerEmployeeName = normalizeString(readHeader(row, 'Manager Employee Name'));
        const impactLevel = normalizeString(readHeader(row, 'Impact Level'));

        // Skip rows without required fields
        if (!email || !employeeNumber || !employeeName) {
          skipped++;
          console.log(`⚠️  Row ${i + 1}: Skipped (missing required fields)`);
          continue;
        }

        // Upsert employee
        await Employee.findOneAndUpdate(
          { email },
          {
            employeeNumber,
            employeeName,
            designation,
            email,
            phone,
            managerEmail,
            managerEmployeeNo,
            managerEmployeeName,
            impactLevel,
          },
          { upsert: true, new: true }
        );

        upserted++;
        console.log(`✅ Row ${i + 1}: ${employeeName} (${email})`);
      } catch (error) {
        errors++;
        console.log(`❌ Row ${i + 1}: Error - ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${upserted}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50) + '\n');

    console.log('🎉 Import completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the import
importEmployees();
