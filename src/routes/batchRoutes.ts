import { Router } from 'express';
import {
  executeBatch,
  batchGetPosts,
  batchGetUsers,
  batchGetComments,
} from '../controllers/batchController';
import { authenticate } from '../middleware/auth';
import { validateBatchRequest } from '../middleware/batchHandler';

const router = Router();

/**
 * @route   POST /api/batch
 * @desc    Execute multiple API requests in a single call
 * @access  Private
 * 
 * Request body:
 * {
 *   "requests": [
 *     {
 *       "method": "GET",
 *       "path": "/api/posts/123/comments",
 *       "headers": {}
 *     },
 *     {
 *       "method": "GET",
 *       "path": "/api/users/456",
 *       "headers": {}
 *     }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "responses": [
 *       {
 *         "status": 200,
 *         "headers": {},
 *         "body": { ... }
 *       },
 *       {
 *         "status": 200,
 *         "headers": {},
 *         "body": { ... }
 *       }
 *     ]
 *   }
 * }
 */
router.post(
  '/',
  authenticate,
  validateBatchRequest,
  executeBatch
);

/**
 * @route   POST /api/batch/posts
 * @desc    Batch fetch multiple posts by IDs
 * @access  Private
 * 
 * Request body:
 * {
 *   "postIds": ["post1", "post2", "post3"]
 * }
 */
router.post('/posts', authenticate, batchGetPosts);

/**
 * @route   POST /api/batch/users
 * @desc    Batch fetch multiple users by IDs
 * @access  Private
 * 
 * Request body:
 * {
 *   "userIds": ["user1", "user2", "user3"]
 * }
 */
router.post('/users', authenticate, batchGetUsers);

/**
 * @route   POST /api/batch/comments
 * @desc    Batch fetch multiple comments by IDs
 * @access  Private
 * 
 * Request body:
 * {
 *   "commentIds": ["comment1", "comment2", "comment3"]
 * }
 */
router.post('/comments', authenticate, batchGetComments);

export default router;

