import { Router } from 'express';
import { register, login, refreshToken } from '../controllers/userController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);

export default router;

