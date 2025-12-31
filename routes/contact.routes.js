import express from 'express';
import { submitContact } from '../controller/contact/create.controller.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// Submit contact form (public route - no authentication required)
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?\d{1,3}[\s-]?\d{1,14}$/)
      .withMessage('Please provide a valid phone number'),
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Subject cannot exceed 200 characters'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 10 })
      .withMessage('Message must be at least 10 characters')
      .isLength({ max: 5000 })
      .withMessage('Message cannot exceed 5000 characters'),
  ],
  validate,
  submitContact
);

export default router;



