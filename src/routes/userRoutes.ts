import { Router } from 'express';
import { register } from '../controllers/userController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, register);

export default router;

