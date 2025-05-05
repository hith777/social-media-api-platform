import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validator';
import contentService from '../services/content/contentService';
import { z } from 'zod';
import {
  postContentSchema,
  postVisibilitySchema,
  mediaUrlsSchema,
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
