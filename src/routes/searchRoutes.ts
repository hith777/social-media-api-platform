import { Router } from 'express';
import { searchPosts, searchUsers } from '../controllers/searchController';
import { optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Search routes
router.get('/posts', optionalAuthenticate, searchPosts);
router.get('/users', optionalAuthenticate, searchUsers);

export default router;

