import { Router } from 'express';
import {
  createPost,
  getPost,
  getPosts,
  getFeed,
  getUserPosts,
  updatePost,
  deletePost,
  reportPost,
  createComment,
  getPostComments,
} from '../controllers/contentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import {
  uploadPostMediaMiddleware,
  handleUploadError,
  optimizePostMediaAfterUpload,
} from '../middleware/upload';

const router = Router();

// Public routes (specific routes must come before parameterized routes)
router.get('/', optionalAuthenticate, getPosts);
router.get('/user/:userId', optionalAuthenticate, getUserPosts);

// Protected routes (specific routes must come before parameterized routes)
router.post(
  '/',
  authenticate,
  uploadPostMediaMiddleware.array('media', 10),
  handleUploadError,
  optimizePostMediaAfterUpload,
  createPost
);
router.get('/feed', authenticate, getFeed);

// Comment routes (must come before parameterized routes)
router.get('/:id/comments', optionalAuthenticate, getPostComments);
router.post('/:id/comments', authenticate, createComment);

// Parameterized routes (must come last)
router.get('/:id', optionalAuthenticate, getPost);
router.put(
  '/:id',
  authenticate,
  uploadPostMediaMiddleware.array('media', 10),
  handleUploadError,
  optimizePostMediaAfterUpload,
  updatePost
);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/report', authenticate, reportPost);

export default router;
