import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { BatchService } from '../services/batch/batchService';

const batchService = new BatchService();

/**
 * @route   POST /api/batch
 * @desc    Execute multiple API requests in a single call
 * @access  Private
 */
export const executeBatch = asyncHandler(
  async (req: Request, res: Response) => {
    const { requests } = req.body as {
      requests: Array<{
        method: string;
        path: string;
        body?: any;
        headers?: Record<string, string>;
      }>;
    };

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      throw new AppError('Batch requests array is required', 400);
    }

    if (requests.length > 20) {
      throw new AppError('Maximum 20 requests per batch', 400);
    }

    // Execute batch requests
    const responses = await Promise.allSettled(
      requests.map(async (batchReq) => {
        try {
          return await executeSingleBatchRequest(req, batchReq);
        } catch (error) {
          return {
            status: error instanceof AppError ? error.statusCode : 500,
            headers: {},
            body: {
              success: false,
              message:
                error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      })
    );

    // Format responses
    const formattedResponses = responses.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          status: 500,
          headers: {},
          body: {
            success: false,
            message: result.reason?.message || 'Unknown error',
          },
        };
      }
    });

    res.status(200).json({
      success: true,
      data: {
        responses: formattedResponses,
      },
    });
  }
);

/**
 * @route   POST /api/batch/posts
 * @desc    Batch fetch multiple posts by IDs
 * @access  Private
 */
export const batchGetPosts = asyncHandler(
  async (req: Request, res: Response) => {
    const { postIds } = req.body as { postIds: string[] };

    if (!postIds || !Array.isArray(postIds)) {
      throw new AppError('postIds array is required', 400);
    }

    const userId = (req as any).user?.id;
    const posts = await batchService.batchGetPosts(postIds, userId);

    res.status(200).json({
      success: true,
      data: {
        posts,
      },
    });
  }
);

/**
 * @route   POST /api/batch/users
 * @desc    Batch fetch multiple users by IDs
 * @access  Private
 */
export const batchGetUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const { userIds } = req.body as { userIds: string[] };

    if (!userIds || !Array.isArray(userIds)) {
      throw new AppError('userIds array is required', 400);
    }

    const requesterId = (req as any).user?.id;
    const users = await batchService.batchGetUsers(userIds, requesterId);

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  }
);

/**
 * @route   POST /api/batch/comments
 * @desc    Batch fetch multiple comments by IDs
 * @access  Private
 */
export const batchGetComments = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentIds } = req.body as { commentIds: string[] };

    if (!commentIds || !Array.isArray(commentIds)) {
      throw new AppError('commentIds array is required', 400);
    }

    const userId = (req as any).user?.id;
    const comments = await batchService.batchGetComments(commentIds, userId);

    res.status(200).json({
      success: true,
      data: {
        comments,
      },
    });
  }
);

/**
 * Execute a single batch request
 * Note: This is a framework for general batch requests.
 * For specific use cases, use the dedicated batch endpoints:
 * - POST /api/batch/posts
 * - POST /api/batch/users
 * - POST /api/batch/comments
 */
async function executeSingleBatchRequest(
  _originalReq: Request,
  batchReq: {
    method: string;
    path: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<{
  status: number;
  headers: Record<string, string>;
  body: any;
}> {
  // This is a placeholder for future implementation
  // For now, recommend using dedicated batch endpoints
  return {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
    body: {
      success: false,
      message:
        'General batch requests not yet implemented. Use dedicated endpoints: /api/batch/posts, /api/batch/users, /api/batch/comments',
      method: batchReq.method,
      path: batchReq.path,
    },
  };
}

