import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['Customer', 'Vendor', 'Admin']).withMessage('Invalid role'),
  // Vendor specific fields
  body('businessName')
    .if(body('role').equals('Vendor'))
    .trim()
    .notEmpty()
    .withMessage('Business name is required for vendors'),
  body('businessAddress')
    .if(body('role').equals('Vendor'))
    .trim()
    .notEmpty()
    .withMessage('Business address is required for vendors'),
  body('businessLicense')
    .if(body('role').equals('Vendor'))
    .trim()
    .notEmpty()
    .withMessage('Business license is required for vendors'),
  body('storeName')
    .if(body('role').equals('Vendor'))
    .trim()
    .notEmpty()
    .withMessage('Store name is required for vendors'),
];

export const loginValidator = [
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().notEmpty(),
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Either email or phone is required');
    }
    return true;
  }),
];

export const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

export const forgotPasswordValidator = [
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().notEmpty(),
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Either email or phone is required');
    }
    return true;
  }),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const verifyEmailValidator = [
  body('token').notEmpty().withMessage('Verification token is required'),
];

export const verifyPhoneValidator = [
  body('code').notEmpty().withMessage('Verification code is required'),
];


