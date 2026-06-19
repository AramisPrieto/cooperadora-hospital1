import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} from '../middleware/validators.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// authLimiter: 10 requests por IP cada 15 minutos — protege contra brute force
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

// Rutas de recuperación de contraseña
router.post('/forgot-password', authLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', authLimiter, validateResetPassword, resetPassword);

// Rutas para sesión con cookies
router.get('/me', authenticateJWT, getMe);
router.post('/logout', logout);

export default router;
