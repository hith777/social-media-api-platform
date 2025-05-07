import { Router } from 'express';
import {
  createPost,
  getPost,
  getFeed,
  getUserPosts,
  updatePost,
  deletePost,
} from '../controllers/contentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/:id', optionalAuthenticate, getPost);
router.get('/user/:userId', optionalAuthenticate, getUserPosts);

// Protected routes
router.post('/', authenticate, createPost);
router.get('/feed', authenticate, getFeed);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

export default router;
