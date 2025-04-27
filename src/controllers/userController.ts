import { Request, Response } from 'express';
import { UserService } from '../services/user/userService';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validator';
import { z } from 'zod';
import { emailSchema, passwordSchema, usernameSchema } from '../utils/validation';

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
