import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

// Create router
const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', login);

export default router;