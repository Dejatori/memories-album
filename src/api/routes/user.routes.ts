import { Router } from 'express';
import { getMe } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

// Create router
const router = Router();

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', protect, getMe);

export default router;