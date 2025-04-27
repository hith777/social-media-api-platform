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
