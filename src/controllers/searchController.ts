import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateQuery } from '../middleware/validator';
import searchService from '../services/search/searchService';
import { paginationSchema } from '../utils/validation';
import { optionalAuthenticate } from '../middleware/auth';
import { z } from 'zod';

// Search query schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Search query cannot exceed 200 characters'),
  page: paginationSchema.shape.page,
  limit: paginationSchema.shape.limit,
});

/**
 * @route   GET /api/search/posts
 * @desc    Search posts with full-text search
 * @access  Public (optional auth)
 */
export const searchPosts = [
  optionalAuthenticate,
  validateQuery(searchQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const queryParams = req.query as unknown as {
      q: string;
      page?: number;
      limit?: number;
    };

    const { q, page = 1, limit = 20 } = queryParams;

    const result = await searchService.searchPosts(q, page, limit, userId);

    res.json({
      success: true,
      data: result,
    });
  }),
];

