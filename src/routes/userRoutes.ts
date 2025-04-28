import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getOwnProfile,
  updateOwnProfile,
  getProfile,
} from '../controllers/userController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.get('/:id', getProfile);

// Protected routes
router.get('/me', getOwnProfile);
router.put('/me', updateOwnProfile);

export default router;

