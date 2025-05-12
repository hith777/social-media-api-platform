import { Router } from 'express';
import { updateComment, deleteComment } from '../controllers/contentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Comment routes
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);

export default router;

