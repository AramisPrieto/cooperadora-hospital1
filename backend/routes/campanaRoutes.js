import express from 'express';
import {
  getAllCampanas,
  getCampanaById,
  createCampana,
  updateCampana,
  deleteCampana,
  donarCampana
} from '../controllers/campanaController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { donationLimiter } from '../middleware/rateLimiter.js';
import { validateDonation } from '../middleware/validators.js';

const router = express.Router();

// Obtener todas las campañas basicas para Home (Público)
router.get('/', getAllCampanas);

// Ver campaña individual completa: requiere JWT (Cero Anonimato para interactuar con detalles de campaña)
router.get('/:id', authenticateJWT, getCampanaById);

// Donar a campaña: requiere JWT (Cero Anonimato) + rate limit + validación de monto
router.post('/:id/donar', authenticateJWT, donationLimiter, validateDonation, donarCampana);

// Rutas de administración de campañas (Solo Admin)
router.post('/', authenticateJWT, authorizeRoles('admin'), createCampana);
router.put('/:id', authenticateJWT, authorizeRoles('admin'), updateCampana);
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), deleteCampana);

export default router;
