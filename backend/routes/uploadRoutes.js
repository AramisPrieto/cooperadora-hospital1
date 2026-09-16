import express from 'express';
import { upload, uploadFile } from '../controllers/uploadController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Middleware para verificar permisos según el tipo de upload
const verifyUploadPermission = (req, res, next) => {
  const tipo = req.query.tipo;
  if (tipo === 'imagen' && req.user?.rol !== 'admin') {
    return res.status(403).json({
      error: 'Permisos insuficientes',
      message: 'Solo los administradores pueden subir imágenes para campañas o noticias.'
    });
  }
  next();
};

// POST /api/uploads?tipo=imagen|comprobante (requiere sesión; imágenes exclusivo admin)
router.post('/', authenticateJWT, verifyUploadPermission, upload.single('file'), uploadFile);

export default router;
