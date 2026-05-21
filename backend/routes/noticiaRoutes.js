import express from 'express';
import {
  getAllNoticias,
  getNoticiaById,
  createNoticia,
  updateNoticia,
  deleteNoticia
} from '../controllers/noticiaController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Listar y ver detalles de noticias (Público, según las especificaciones del PDF)
router.get('/', getAllNoticias);
router.get('/:id', getNoticiaById);

// Rutas de administración de noticias (Solo Admin)
router.post('/', authenticateJWT, authorizeRoles('admin'), createNoticia);
router.put('/:id', authenticateJWT, authorizeRoles('admin'), updateNoticia);
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), deleteNoticia);

export default router;
