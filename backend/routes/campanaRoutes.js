import express from 'express';
import {
  getAllCampanas,
  getCampanaById,
  getDonantes,
  createCampana,
  updateCampana,
  deleteCampana
} from '../controllers/campanaController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las campañas — ?sort=urgente|cercana|mayor_meta &search=texto &all=true (Público)
router.get('/', getAllCampanas);

// Ver campaña individual completa (Público)
router.get('/:id', getCampanaById);

// Últimos donantes de una campaña (Público - datos enmascarados)
router.get('/:id/donantes', getDonantes);

// Rutas de administración de campañas (Solo Admin)
router.post('/', authenticateJWT, authorizeRoles('admin'), createCampana);
router.put('/:id', authenticateJWT, authorizeRoles('admin'), updateCampana);
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), deleteCampana);

export default router;
