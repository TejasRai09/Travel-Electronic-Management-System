import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import express from 'express';

import { connectDb } from './mongo.js';
import { authRouter } from './routes/auth.js';
import { travelRouter } from './routes/travel.js';
import { expertRouter } from './routes/expert.js';
import { pocRouter } from './routes/poc.js';
import { vendorRouter } from './routes/vendor.js';
import notificationRouter from './routes/notifications.js';

console.log('Starting server...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config();

const PORT = Number(process.env.PORT || 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/travel', travelRouter);
app.use('/api/expert', expertRouter);
app.use('/api/poc', pocRouter);
app.use('/api/vendor', vendorRouter);
app.use('/api/notifications', notificationRouter);

// Start server first so the frontend wait-on script can resolve
app.listen(PORT, async () => {
  // eslint-disable-next-line no-console
  console.log(`Auth API listening on http://localhost:${PORT}`);
  
  try {
    await connectDb();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
});
