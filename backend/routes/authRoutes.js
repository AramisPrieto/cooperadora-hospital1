import express from 'express';
import { register, login } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateRegister, validateLogin } from '../middleware/validators.js';

const router = express.Router();

// authLimiter: 10 requests por IP cada 15 minutos — protege contra brute force
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

export default router;
