import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.js';
import { Vendor } from '../models/vendor.js';
import { sendError } from '../utils/response.js';

/**
 * Authenticate user via JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication required');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return sendError(res, 401, 'Authentication required');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user) {
      return sendError(res, 401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Invalid or expired token');
    }
    return sendError(res, 500, 'Authentication failed');
  }
};

/**
 * Authorize user by role
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Access denied. Insufficient permissions');
    }

    next();
  };
};

/**
 * Vendor only access
 */
export const vendorOnly = [
  authenticate,
  authorize('Vendor'),
];

/**
 * Admin only access
 */
export const adminOnly = [
  authenticate,
  authorize('Admin'),
];

/**
 * Customer only access
 */
export const customerOnly = [
  authenticate,
  authorize('Customer'),
];

/**
 * Check if vendor is active and approved
 */
export const vendorActive = async (req, res, next) => {
  try {
    if (req.user.role !== 'Vendor') {
      return sendError(res, 403, 'Vendor access required');
    }

    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return sendError(res, 404, 'Vendor profile not found');
    }

    if (vendor.status !== 'active' || !vendor.isActive) {
      return sendError(res, 403, 'Vendor account is not active. Please wait for admin approval.');
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    return sendError(res, 500, 'Vendor verification failed');
  }
};

/**
 * Check if vendor owns the resource
 * Allows access for users with vendor application (pending, active, or rejected)
 */
export const vendorOwner = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return sendError(res, 404, 'Vendor profile not found');
    }

    // Allow access if user has vendor application (regardless of role or status)
    // This allows pending vendors (who are still Customers) to view their profile
    req.vendor = vendor;
    next();
  } catch (error) {
    return sendError(res, 500, 'Vendor verification failed');
  }
};


