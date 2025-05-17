import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateParams, validateQuery } from '../middleware/validator';
import socialService from '../services/social/socialService';
import { idParamSchema, paginationSchema } from '../utils/validation';

/**
 * @route   POST /api/social/follow/:id
 * @desc    Follow a user
 * @access  Private
 */
export const followUser = [
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id: followingId } = req.params;
    await socialService.followUser(req.user.id, followingId);

    res.json({
      success: true,
      message: 'User followed successfully',
    });
  }),
];

/**
 * @route   DELETE /api/social/follow/:id
 * @desc    Unfollow a user
 * @access  Private
 */
export const unfollowUser = [
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id: followingId } = req.params;
    await socialService.unfollowUser(req.user.id, followingId);

    res.json({
      success: true,
      message: 'User unfollowed successfully',
    });
  }),
];

