import express from 'express';
import { getProfile } from '../controller/user/profile/get.controller.js';
import { updateProfile } from '../controller/user/profile/update.controller.js';
import { changePassword } from '../controller/user/profile/changePassword.controller.js';
import { uploadProfilePicture } from '../controller/user/profile/uploadPicture.controller.js';
import { deleteProfilePicture } from '../controller/user/profile/deletePicture.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
  ],
  validate,
  updateProfile
);
router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);
router.post('/profile-picture', upload.single('image'), uploadProfilePicture);
router.delete('/profile-picture', deleteProfilePicture);

export default router;
