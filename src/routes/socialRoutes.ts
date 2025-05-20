import { Router } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  likePost,
  unlikePost,
  togglePostLike,
} from '../controllers/socialController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Follow routes (specific routes must come before parameterized routes)
router.get('/followers/:id', optionalAuthenticate, getFollowers);
router.get('/following/:id', optionalAuthenticate, getFollowing);

// Post like routes (specific routes must come before parameterized routes)
router.post('/posts/:id/like', authenticate, likePost);
router.delete('/posts/:id/like', authenticate, unlikePost);
router.post('/posts/:id/toggle-like', authenticate, togglePostLike);

// Parameterized routes (must come last)
router.post('/follow/:id', authenticate, followUser);
router.delete('/follow/:id', authenticate, unfollowUser);

export default router;



