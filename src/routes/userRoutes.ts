import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getOwnProfile,
  updateOwnProfile,
  getProfile,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
} from '../controllers/userController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/:id', getProfile);

// Protected routes
router.get('/me', getOwnProfile);
router.put('/me', updateOwnProfile);
router.post('/resend-verification', resendVerification);

export default router;

