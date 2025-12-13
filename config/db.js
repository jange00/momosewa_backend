import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', false);
  await mongoose.connect(env.MONGO_URI, {
    autoIndex: true,
  });
  console.log('Connected to MongoDB');
}