import { Router } from 'express';
import { followUser, unfollowUser } from '../controllers/socialController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Follow routes
router.post('/follow/:id', authenticate, followUser);
router.delete('/follow/:id', authenticate, unfollowUser);

export default router;



