import { Router } from 'express';
import {
  createPost,
  getPost,
  getPosts,
  getFeed,
  getUserPosts,
  updatePost,
  deletePost,
} from '../controllers/contentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import {
  uploadPostMediaMiddleware,
  handleUploadError,
} from '../middleware/upload';

const router = Router();

// Public routes (specific routes must come before parameterized routes)
router.get('/', optionalAuthenticate, getPosts);
router.get('/user/:userId', optionalAuthenticate, getUserPosts);
router.get('/:id', optionalAuthenticate, getPost);

// Protected routes
router.post(
  '/',
  authenticate,
  uploadPostMediaMiddleware.array('media', 10),
  handleUploadError,
  createPost
);
router.get('/feed', authenticate, getFeed);
router.put(
  '/:id',
  authenticate,
  uploadPostMediaMiddleware.array('media', 10),
  handleUploadError,
  updatePost
);
router.delete('/:id', authenticate, deletePost);

export default router;
