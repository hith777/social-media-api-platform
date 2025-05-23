import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateQuery } from '../middleware/validator';
import searchService from '../services/search/searchService';
import { paginationSchema } from '../utils/validation';
import { optionalAuthenticate } from '../middleware/auth';
import { z } from 'zod';

// Search query schema with filters and sorting
const searchPostsQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Search query cannot exceed 200 characters'),
  page: paginationSchema.shape.page,
  limit: paginationSchema.shape.limit,
  visibility: z.enum(['public', 'private', 'friends']).optional(),
  authorId: z.string().optional(),
  minLikes: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  minComments: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  dateFrom: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  dateTo: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  sortBy: z.enum(['newest', 'oldest', 'popular', 'relevance']).optional(),
});

/**
 * @route   GET /api/search/posts
 * @desc    Search posts with full-text search, filters, and sorting
 * @access  Public (optional auth)
 */
export const searchPosts = [
  optionalAuthenticate,
  validateQuery(searchPostsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const queryParams = req.query as unknown as {
      q: string;
      page?: number;
      limit?: number;
      visibility?: 'public' | 'private' | 'friends';
      authorId?: string;
      minLikes?: number;
      minComments?: number;
      dateFrom?: Date;
      dateTo?: Date;
      sortBy?: 'newest' | 'oldest' | 'popular' | 'relevance';
    };

    const {
      q,
      page = 1,
      limit = 20,
      visibility,
      authorId,
      minLikes,
      minComments,
      dateFrom,
      dateTo,
      sortBy = 'newest',
    } = queryParams;

    const filters = {
      ...(visibility && { visibility }),
      ...(authorId && { authorId }),
      ...(minLikes !== undefined && { minLikes }),
      ...(minComments !== undefined && { minComments }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    };

    const result = await searchService.searchPosts(q, page, limit, userId, filters, sortBy);

    res.json({
      success: true,
      data: result,
    });
  }),
];

// User search query schema with filters and sorting
const searchUsersQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Search query cannot exceed 200 characters'),
  page: paginationSchema.shape.page,
  limit: paginationSchema.shape.limit,
  verifiedOnly: z.string().optional().transform((val) => val === 'true'),
  hasBio: z.string().optional().transform((val) => val === 'true'),
  sortBy: z.enum(['relevance', 'newest', 'oldest', 'username']).optional(),
});

/**
 * @route   GET /api/search/users
 * @desc    Search users by username, name, or email with filters and sorting
 * @access  Public (optional auth)
 */
export const searchUsers = [
  optionalAuthenticate,
  validateQuery(searchUsersQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const queryParams = req.query as unknown as {
      q: string;
      page?: number;
      limit?: number;
      verifiedOnly?: boolean;
      hasBio?: boolean;
      sortBy?: 'relevance' | 'newest' | 'oldest' | 'username';
    };

    const { q, page = 1, limit = 20, verifiedOnly, hasBio, sortBy = 'relevance' } = queryParams;

    const filters = {
      ...(verifiedOnly !== undefined && { verifiedOnly }),
      ...(hasBio !== undefined && { hasBio }),
    };

    const result = await searchService.searchUsers(q, page, limit, userId, filters, sortBy);

    res.json({
      success: true,
      data: result,
    });
  }),
];

// Trending posts query schema
const trendingQuerySchema = paginationSchema.extend({
  timeRange: z.enum(['day', 'week', 'month', 'all']).optional(),
});

/**
 * @route   GET /api/search/trending
 * @desc    Get trending posts based on engagement and recency
 * @access  Public (optional auth)
 */
export const getTrendingPosts = [
  optionalAuthenticate,
  validateQuery(trendingQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const queryParams = req.query as unknown as {
      page?: number;
      limit?: number;
      timeRange?: 'day' | 'week' | 'month' | 'all';
    };

    const { page = 1, limit = 20, timeRange = 'week' } = queryParams;

    const result = await searchService.getTrendingPosts(page, limit, userId, timeRange);

    res.json({
      success: true,
      data: result,
    });
  }),
];

