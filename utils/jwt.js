import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate access token
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE || '15m',
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET || env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRE || '7d',
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET || env.JWT_SECRET);
}


