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
import {
  uploadAvatarMiddleware,
  handleUploadError,
  optimizeAvatarAfterUpload,
} from '../middleware/upload';

const router = Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 */
// Public routes (specific routes must come before parameterized routes)
router.post('/register', authLimiter, register);
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or username
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/search', searchUsers);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
// Protected routes (specific routes must come before parameterized routes)
router.get('/me', getOwnProfile);
router.put('/me', updateOwnProfile);
router.delete('/me', deleteAccount);
router.post(
  '/me/avatar',
  uploadAvatarMiddleware.single('avatar'),
  handleUploadError,
  optimizeAvatarAfterUpload,
  uploadAvatar
);
router.post('/resend-verification', resendVerification);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/blocked', getBlockedUsers);

// Parameterized routes (must come last)
router.get('/:id', getProfile);

export default router;

