import { User } from '../models/user.js';
import { VendorApplication } from '../models/vendorApplication.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { emitNotification } from '../services/notificationSocket.js';

/**
 * Register new user
 */
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'Customer' } = req.body;

    // If vendor registration, only create VendorApplication (NO User account yet)
    if (role === 'Vendor') {
      const { businessName, businessAddress, businessLicense, storeName } = req.body;

      if (!businessName || !businessAddress || !businessLicense || !storeName) {
        return sendError(res, 400, 'Vendor registration requires business details');
      }

      // Check if user or application already exists
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { phone }],
      });

      if (existingUser) {
        return sendError(res, 400, 'User with this email or phone already exists');
      }

      // Check if application already exists
      const existingApplication = await VendorApplication.findOne({
        $or: [{ email: email.toLowerCase() }, { phone }],
      });

      if (existingApplication) {
        return sendError(res, 400, 'Vendor application with this email or phone already exists');
      }

      // Create vendor application only (NO User account created until admin approval)
      const application = await VendorApplication.create({
        name,
        email: email.toLowerCase(),
        phone,
        password, // Will be hashed by pre-save hook
        businessName,
        businessAddress,
        businessLicense,
        storeName,
        status: 'pending',
      });

      return sendSuccess(res, {
        data: {
          application: {
            _id: application._id,
            email: application.email,
            status: application.status,
          },
        },
        message: 'Vendor application submitted successfully. Please wait for admin approval before you can login.',
      });
    }

    // For non-vendor registration, create user account immediately
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      return sendError(res, 400, 'User with this email or phone already exists');
    }

    // Check if there's a pending vendor application with this email/phone
    const existingApplication = await VendorApplication.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingApplication) {
      return sendError(res, 400, 'An application with this email or phone already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role,
    });

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return sendSuccess(res, {
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(res, 500, 'Registration failed', error.message);
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      return sendError(res, 400, 'Password is required');
    }

    // Find user by email or phone
    const query = email ? { email: email.toLowerCase() } : { phone };
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token and update last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return sendSuccess(res, {
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'Login failed', error.message);
  }
};

/**
 * Refresh access token
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 400, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, 401, 'Invalid refresh token');
    }

    // Generate new access token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    return sendSuccess(res, {
      data: {
        accessToken: newAccessToken,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Invalid or expired refresh token');
    }
    return sendError(res, 500, 'Token refresh failed', error.message);
  }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    return sendSuccess(res, { message: 'Logout successful' });
  } catch (error) {
    return sendError(res, 500, 'Logout failed', error.message);
  }
};

/**
 * Forgot password - request password reset
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;

    const query = email ? { email: email.toLowerCase() } : { phone };
    const user = await User.findOne(query);

    if (!user) {
      // Don't reveal if user exists
      return sendSuccess(res, {
        message: 'If the account exists, a password reset link has been sent',
      });
    }

    // Generate reset token (simple implementation - can be enhanced with email service)
    const resetToken = generateAccessToken({ userId: user._id.toString() });

    // TODO: Send email with reset token
    // await sendPasswordResetEmail(user.email, resetToken);

    return sendSuccess(res, {
      message: 'If the account exists, a password reset link has been sent',
      // In development, return token (remove in production)
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    return sendError(res, 500, 'Password reset request failed', error.message);
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, 400, 'Token and new password are required');
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid or expired token');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return sendSuccess(res, { message: 'Password reset successful' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Invalid or expired token');
    }
    return sendError(res, 500, 'Password reset failed', error.message);
  }
};

/**
 * Verify email
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendError(res, 400, 'Verification token is required');
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendError(res, 401, 'Invalid token');
    }

    user.isEmailVerified = true;
    await user.save();

    return sendSuccess(res, { message: 'Email verified successfully' });
  } catch (error) {
    return sendError(res, 500, 'Email verification failed', error.message);
  }
};

/**
 * Verify phone
 */
export const verifyPhone = async (req, res) => {
  try {
    const { code } = req.body;

    // TODO: Implement phone verification with OTP service
    // For now, just mark as verified if code is provided
    if (!code) {
      return sendError(res, 400, 'Verification code is required');
    }

    const user = await User.findById(req.user._id);
    user.isPhoneVerified = true;
    await user.save();

    return sendSuccess(res, { message: 'Phone verified successfully' });
  } catch (error) {
    return sendError(res, 500, 'Phone verification failed', error.message);
  }
};


