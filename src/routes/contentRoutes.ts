import { Router } from 'express';
import { createPost } from '../controllers/contentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected routes
router.post('/', authenticate, createPost);

export default router;
