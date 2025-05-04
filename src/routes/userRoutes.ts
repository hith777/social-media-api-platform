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
  uploadAvatar,
  searchUsers,
  blockUser,
  unblockUser,
  getBlockedUsers,
  deleteAccount,
} from '../controllers/userController';
import { authLimiter } from '../middleware/rateLimiter';
import { uploadAvatarMiddleware, handleUploadError } from '../middleware/upload';

const router = Router();

// Public routes (specific routes must come before parameterized routes)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/search', searchUsers);

// Protected routes (specific routes must come before parameterized routes)
router.get('/me', getOwnProfile);
router.put('/me', updateOwnProfile);
router.delete('/me', deleteAccount);
router.post('/me/avatar', uploadAvatarMiddleware.single('avatar'), handleUploadError, uploadAvatar);
router.post('/resend-verification', resendVerification);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/blocked', getBlockedUsers);

// Parameterized routes (must come last)
router.get('/:id', getProfile);

export default router;

