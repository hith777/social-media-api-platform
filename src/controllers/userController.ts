import { Request, Response } from 'express';
import { UserService } from '../services/user/userService';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams } from '../middleware/validator';
import { z } from 'zod';
import { emailSchema, passwordSchema, usernameSchema, idParamSchema } from '../utils/validation';
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
