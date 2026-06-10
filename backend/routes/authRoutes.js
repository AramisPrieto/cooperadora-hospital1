import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateRegister, validateLogin } from '../middleware/validators.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// authLimiter: 10 requests por IP cada 15 minutos — protege contra brute force
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

// Rutas para sesión con cookies
router.get('/me', authenticateJWT, getMe);
router.post('/logout', logout);

export default router;
