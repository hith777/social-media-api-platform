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

/**
 * @route   GET /api/social/followers/:id
 * @desc    Get followers of a user
 * @access  Public (optional auth)
 */
export const getFollowers = [
  validateParams(idParamSchema),
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: userId } = req.params;

    const queryParams = req.query as unknown as {
      page?: number;
      limit?: number;
    };

    const { page = 1, limit = 20 } = queryParams;

    const result = await socialService.getFollowers(userId, page, limit);

    res.json({
      success: true,
      data: result,
    });
  }),
];

/**
 * @route   GET /api/social/following/:id
 * @desc    Get users that a user is following
 * @access  Public (optional auth)
 */
export const getFollowing = [
  validateParams(idParamSchema),
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: userId } = req.params;

    const queryParams = req.query as unknown as {
      page?: number;
      limit?: number;
    };

    const { page = 1, limit = 20 } = queryParams;

    const result = await socialService.getFollowing(userId, page, limit);

    res.json({
      success: true,
      data: result,
    });
  }),
];

/**
 * @route   POST /api/social/posts/:id/like
 * @desc    Like a post
 * @access  Private
 */
export const likePost = [
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id: postId } = req.params;
    await socialService.likePost(postId, req.user.id);

    res.json({
      success: true,
      message: 'Post liked successfully',
    });
  }),
];

/**
 * @route   DELETE /api/social/posts/:id/like
 * @desc    Unlike a post
 * @access  Private
 */
export const unlikePost = [
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id: postId } = req.params;
    await socialService.unlikePost(postId, req.user.id);

    res.json({
      success: true,
      message: 'Post unliked successfully',
    });
  }),
];

/**
 * @route   POST /api/social/posts/:id/toggle-like
 * @desc    Toggle post like (like if not liked, unlike if liked)
 * @access  Private
 */
export const togglePostLike = [
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id: postId } = req.params;
    const result = await socialService.togglePostLike(postId, req.user.id);

    res.json({
      success: true,
      message: result.liked ? 'Post liked successfully' : 'Post unliked successfully',
      data: result,
    });
  }),
];

