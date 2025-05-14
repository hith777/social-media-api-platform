import { Router } from 'express';
import {
  updateComment,
  deleteComment,
  getCommentReplies,
} from '../controllers/contentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Comment routes (specific routes must come before parameterized routes)
router.get('/:id/replies', optionalAuthenticate, getCommentReplies);

// Parameterized routes (must come last)
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);

export default router;

