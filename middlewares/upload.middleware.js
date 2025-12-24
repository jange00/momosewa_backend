import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import streamifier from 'streamifier';

// Validate Cloudinary configuration
if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
  console.error('⚠️  Cloudinary credentials are missing! Please check your .env file.');
  console.error('Required variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
} else {
  console.log('✅ Cloudinary configured successfully');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Memory storage for multer
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload single image to Cloudinary
export const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    // Validate Cloudinary is configured
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return reject(new Error('Cloudinary is not configured. Please check your environment variables.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'momosewa',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

// Upload multiple images to Cloudinary
export const uploadMultipleToCloudinary = async (files) => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file));
  return Promise.all(uploadPromises);
};

//  Delete image from Cloudinary
export const deleteFromCloudinary = async (imageUrl) => {
  try {
    // Extract public_id from URL
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

