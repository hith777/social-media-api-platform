import { Request, Response } from 'express';
import { UserService } from '../services/user/userService';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validator';
import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  idParamSchema,
} from '../utils/validation';
import { authenticate } from '../middleware/auth';

const userService = new UserService();

// Registration schema
const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
});

// Login schema
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Refresh token schema
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = [
  validateBody(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  }),
];

/**
 * @route   POST /api/users/login
 * @desc    Login user and get tokens
 * @access  Public
 */
export const login = [
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    const result = await userService.login(identifier, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  }),
];

/**
 * @route   POST /api/users/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshToken = [
  validateBody(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken: token } = req.body;
    const result = await userService.refreshAccessToken(token);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  }),
];

// Update profile schema
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
});

/**
 * @route   GET /api/users/me
 * @desc    Get current user's profile
 * @access  Private
 */
export const getOwnProfile = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await userService.getOwnProfile(req.user.id);

    if (!user) {
      throw new Error('User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  }),
];

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
export const updateOwnProfile = [
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await userService.updateProfile(req.user.id, req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  }),
];

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID (public)
 * @access  Public
 */
export const getProfile = [
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.getProfile(id);

    if (!user) {
      throw new Error('User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  }),
];

// Email verification schema
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * @route   POST /api/users/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
export const verifyEmail = [
  validateBody(verifyEmailSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    await userService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  }),
];

/**
 * @route   POST /api/users/resend-verification
 * @desc    Resend email verification
 * @access  Private
 */
export const resendVerification = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await userService.resendVerificationEmail(req.user.id);

    res.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  }),
];

// Password reset request schema
const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

// Password reset schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

/**
 * @route   POST /api/users/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
export const requestPasswordReset = [
  validateBody(requestPasswordResetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await userService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });
  }),
];

/**
 * @route   POST /api/users/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
export const resetPassword = [
  validateBody(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    await userService.resetPassword(token, password);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  }),
];

/**
 * @route   POST /api/users/me/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
export const uploadAvatar = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    if (!req.file) {
      throw new Error('No file uploaded');
    }

    // Get relative path from uploads directory
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    const user = await userService.updateAvatar(req.user.id, avatarPath);

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: user,
    });
  }),
];

// User search query schema
const searchUsersQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 50, {
      message: 'Limit must be between 1 and 50',
    }),
});

/**
 * @route   GET /api/users/search
 * @desc    Search users by username, first name, or last name
 * @access  Public
 */
export const searchUsers = [
  validateQuery(searchUsersQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const queryParams = req.query as unknown as {
      query: string;
      page?: number;
      limit?: number;
    };
    const { query, page = 1, limit = 10 } = queryParams;

    const result = await userService.searchUsers(query, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
    });
  }),
];

// Block user schema
const blockUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// Get blocked users query schema
const getBlockedUsersQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 50, {
      message: 'Limit must be between 1 and 50',
    }),
});

/**
 * @route   POST /api/users/block
 * @desc    Block a user
 * @access  Private
 */
export const blockUser = [
  authenticate,
  validateBody(blockUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { userId } = req.body;
    await userService.blockUser(req.user.id, userId);

    res.json({
      success: true,
      message: 'User blocked successfully',
    });
  }),
];

/**
 * @route   POST /api/users/unblock
 * @desc    Unblock a user
 * @access  Private
 */
export const unblockUser = [
  authenticate,
  validateBody(blockUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { userId } = req.body;
    await userService.unblockUser(req.user.id, userId);

    res.json({
      success: true,
      message: 'User unblocked successfully',
    });
  }),
];

/**
 * @route   GET /api/users/blocked
 * @desc    Get list of blocked users
 * @access  Private
 */
export const getBlockedUsers = [
  authenticate,
  validateQuery(getBlockedUsersQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { page = 1, limit = 10 } = req.query as {
      page?: number;
      limit?: number;
    };

    const result = await userService.getBlockedUsers(req.user.id, page, limit);

    res.json({
      success: true,
      data: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
    });
  }),
];

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
export const deleteAccount = [
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await userService.deleteAccount(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  }),
];
