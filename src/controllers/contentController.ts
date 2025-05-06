import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams } from '../middleware/validator';
import contentService from '../services/content/contentService';
import { z } from 'zod';
import {
  postContentSchema,
  postVisibilitySchema,
  mediaUrlsSchema,
  idParamSchema,
} from '../utils/validation';

// Create post schema
const createPostSchema = z.object({
  content: postContentSchema,
  mediaUrls: mediaUrlsSchema,
  visibility: postVisibilitySchema.optional(),
});

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
export const createPost = [
  validateBody(createPostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const post = await contentService.createPost(req.user.id, {
      content: req.body.content,
      mediaUrls: req.body.mediaUrls,
      visibility: req.body.visibility,
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  }),
];

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Public (with visibility checks)
 */
export const getPost = [
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await contentService.getPostById(id, userId);

    res.json({
      success: true,
      data: post,
    });
  }),
];

/**
 * @route   GET /api/posts/feed
 * @desc    Get user's feed (posts from followed users)
 * @access  Private
 */
export const getFeed = [
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const posts = await contentService.getFeed(req.user.id);

    res.json({
      success: true,
      data: posts,
    });
  }),
];

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get posts by a specific user
 * @access  Public (with visibility checks)
 */
export const getUserPosts = [
  validateParams(z.object({ userId: z.string().min(1, 'User ID is required') })),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const viewerId = req.user?.id;

    const posts = await contentService.getUserPosts(userId, viewerId);

    res.json({
      success: true,
      data: posts,
    });
  }),
];
