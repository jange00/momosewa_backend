
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const NODE_ENV = process.env.NODE_ENV || 'development';

const candidates = [
  path.join(cwd, '.env'),
  path.join(cwd, '.env.local'),
  path.join(cwd, `.env.${NODE_ENV}`),
  path.join(cwd, `.env.local.${NODE_ENV}`),
];

for (const file of candidates) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, override: true });
  }
}

export const env = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT || '5001', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/momosewa',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  // Khalti
  KHALTI_SECRET_KEY: process.env.KHALTI_SECRET_KEY || '',
  KHALTI_PUBLIC_KEY: process.env.KHALTI_PUBLIC_KEY || '',
  KHALTI_WEBHOOK_SECRET: process.env.KHALTI_WEBHOOK_SECRET || '',
  // Email (Nodemailer)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  // Redis (Optional)
  REDIS_URL: process.env.REDIS_URL || '',
  // Socket.io
  SOCKET_IO_CORS_ORIGIN: process.env.SOCKET_IO_CORS_ORIGIN || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // Legacy
  AI_PROVIDER: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  YJS_WS_URL: process.env.YJS_WS_URL || '',
};
