import mongoose from 'mongoose';

export async function connectDb() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI (or MONGO_URI)');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);

  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB');
}
