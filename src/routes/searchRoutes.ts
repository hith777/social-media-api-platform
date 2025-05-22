import { Router } from 'express';
import { searchPosts } from '../controllers/searchController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Search routes
router.get('/posts', optionalAuthenticate, searchPosts);

export default router;

