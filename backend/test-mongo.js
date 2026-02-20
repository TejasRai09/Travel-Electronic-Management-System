import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

console.log('================================');
console.log('MongoDB Connection Test');
console.log('================================');
console.log('URI:', uri || 'NOT SET');
console.log('Attempting to connect...');
console.log('================================');

if (!uri) {
  console.error('❌ ERROR: MongoDB URI not found in .env file');
  console.error('   Please set MONGODB_URI or MONGO_URI in backend/.env');
  process.exit(1);
}

mongoose.set('strictQuery', true);

mongoose.connect(uri)
  .then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB');
    console.log('   Database:', mongoose.connection.db.databaseName);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ ERROR: Failed to connect to MongoDB');
    console.error('   Error:', err.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure MongoDB is running on your machine');
    console.error('2. Check the URI in backend/.env file');
    console.error('3. Try running: net start MongoDB (Windows)');
    console.error('4. Or install MongoDB from: https://www.mongodb.com/try/download/community');
    process.exit(1);
  });
