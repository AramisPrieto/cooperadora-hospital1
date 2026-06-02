// TEAM_001: Rutas de donaciones por transferencia y su gestión administrativa
import express from 'express';
import {
  declararTransferencia,
  getTransferencias,
  aprobarTransferencia,
  rechazarTransferencia
} from '../controllers/donacionController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Rutas de Socio (requiere autenticación general)
router.post('/campanas/:id/donar-transferencia', authenticateJWT, declararTransferencia);

// Rutas de Administración (requiere rol de admin)
router.get('/transferencias', authenticateJWT, authorizeRoles('admin'), getTransferencias);
router.put('/transferencias/:id/aprobar', authenticateJWT, authorizeRoles('admin'), aprobarTransferencia);
router.put('/transferencias/:id/rechazar', authenticateJWT, authorizeRoles('admin'), rechazarTransferencia);

export default router;
