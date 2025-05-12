import { Router } from 'express';
import { updateComment } from '../controllers/contentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Comment routes
router.put('/:id', authenticate, updateComment);

export default router;

