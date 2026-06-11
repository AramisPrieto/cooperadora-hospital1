import express from 'express';
import { upload, uploadFile } from '../controllers/uploadController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// POST /api/uploads?tipo=imagen|comprobante  (requiere sesión)
router.post('/', authenticateJWT, upload.single('file'), uploadFile);

export default router;
