import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateParams, validateQuery } from '../middleware/validator';
import contentService from '../services/content/contentService';
import { z } from 'zod';
import {
  postContentSchema,
  postVisibilitySchema,
  mediaUrlsSchema,
  idParamSchema,
  paginationSchema,
  reportReasonSchema,
} from '../utils/validation';

// Create post schema
const createPostSchema = z.object({
  content: postContentSchema,
  mediaUrls: mediaUrlsSchema,
  visibility: postVisibilitySchema.optional(),
});

// Update post schema
const updatePostSchema = z.object({
  content: postContentSchema.optional(),
  mediaUrls: mediaUrlsSchema,
  visibility: postVisibilitySchema.optional(),
});

// Post query schema for filtering and sorting
const postQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 50, {
      message: 'Limit must be between 1 and 50',
    }),
  sortBy: z.enum(['newest', 'oldest', 'popular']).optional().default('newest'),
  search: z.string().max(100).optional(),
  visibility: postVisibilitySchema.optional(),
  authorId: z.string().optional(),
});

// Report post schema
const reportPostSchema = z.object({
  reason: reportReasonSchema,
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
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

    // Handle uploaded files
    let mediaUrls: string[] = [];
    
    // Get media URLs from uploaded files
    if (req.files && Array.isArray(req.files)) {
      mediaUrls = req.files.map((file: Express.Multer.File) => {
        // Return relative URL path
        return `/uploads/posts/${file.filename}`;
      });
    } else if (req.file) {
      // Single file upload
      mediaUrls = [`/uploads/posts/${req.file.filename}`];
    }

    // Merge with any URLs provided in body
    if (req.body.mediaUrls && Array.isArray(req.body.mediaUrls)) {
      mediaUrls = [...mediaUrls, ...req.body.mediaUrls];
    }

    const post = await contentService.createPost(req.user.id, {
      content: req.body.content,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
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
 * @route   GET /api/posts
 * @desc    Get posts with filtering and sorting
 * @access  Public
 */
export const getPosts = [
  validateQuery(postQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const queryParams = req.query as unknown as {
      page?: number;
      limit?: number;
      sortBy?: 'newest' | 'oldest' | 'popular';
      search?: string;
      visibility?: 'public' | 'private' | 'friends';
      authorId?: string;
    };

    const {
      page = 1,
      limit = 10,
      sortBy = 'newest',
      search,
      visibility,
      authorId,
    } = queryParams;

    const result = await contentService.getPosts(
      {
        authorId,
        visibility,
        search,
      },
      sortBy,
      page,
      limit,
      req.user?.id
    );

    res.json({
      success: true,
      data: result,
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
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const queryParams = req.query as unknown as {
      page?: number;
      limit?: number;
    };

    const { page = 1, limit = 10 } = queryParams;

    const result = await contentService.getFeed(req.user.id, page, limit);

    res.json({
      success: true,
      data: result,
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
  validateQuery(paginationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const viewerId = req.user?.id;

    const queryParams = req.query as unknown as {
      page?: number;
      limit?: number;
    };

    const { page = 1, limit = 10 } = queryParams;

    const result = await contentService.getUserPosts(userId, viewerId, page, limit);

    res.json({
      success: true,
      data: result,
    });
  }),
];

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private (post owner only)
 */
export const updatePost = [
  validateParams(idParamSchema),
  validateBody(updatePostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id } = req.params;

    // Handle uploaded files
    let mediaUrls: string[] | undefined = undefined;
    
    // Get media URLs from uploaded files
    if (req.files && Array.isArray(req.files)) {
      mediaUrls = req.files.map((file: Express.Multer.File) => {
        return `/uploads/posts/${file.filename}`;
      });
    } else if (req.file) {
      // Single file upload
      mediaUrls = [`/uploads/posts/${req.file.filename}`];
    }

    // Merge with any URLs provided in body
    if (req.body.mediaUrls && Array.isArray(req.body.mediaUrls)) {
      mediaUrls = mediaUrls ? [...mediaUrls, ...req.body.mediaUrls] : req.body.mediaUrls;
    }

    const post = await contentService.updatePost(id, req.user.id, {
      content: req.body.content,
      mediaUrls,
      visibility: req.body.visibility,
    });

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });
  }),
];

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (soft delete)
 * @access  Private (post owner only)
 */
export const deletePost = [
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id } = req.params;
    await contentService.deletePost(id, req.user.id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  }),
];

/**
 * @route   POST /api/posts/:id/report
 * @desc    Report a post
 * @access  Private
 */
export const reportPost = [
  validateParams(idParamSchema),
  validateBody(reportPostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id } = req.params;
    await contentService.reportPost(id, req.user.id, {
      reason: req.body.reason,
      description: req.body.description,
    });

    res.json({
      success: true,
      message: 'Post reported successfully',
    });
  }),
];
