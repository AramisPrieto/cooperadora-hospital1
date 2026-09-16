import express from 'express';
import {
  getAllNoticias,
  getNoticiaById,
  createNoticia,
  updateNoticia,
  deleteNoticia
} from '../controllers/noticiaController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import {
  validateMongoId,
  validateNoticia,
  validateNoticiaUpdate
} from '../middleware/validators.js';

const router = express.Router();

// Listar y ver detalles de noticias (Público, según las especificaciones del PDF)
router.get('/', getAllNoticias);
router.get('/:id', validateMongoId('id'), getNoticiaById);

// Rutas de administración de noticias (Solo Admin)
router.post('/', authenticateJWT, authorizeRoles('admin'), validateNoticia, createNoticia);
router.put('/:id', authenticateJWT, authorizeRoles('admin'), validateMongoId('id'), validateNoticiaUpdate, updateNoticia);
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), validateMongoId('id'), deleteNoticia);

export default router;
