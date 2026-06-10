// TEAM_001: Rutas de donaciones por transferencia y su gestión administrativa
import express from 'express';
import {
  declararTransferencia,
  getTransferencias,
  aprobarTransferencia,
  rechazarTransferencia,
  getMyDonaciones,
  crearDonacionMercadoPago,
  handleMpRedirect
} from '../controllers/donacionController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { donationLimiter } from '../middleware/rateLimiter.js';
import { validateDonation } from '../middleware/validators.js';

const router = express.Router();

// Ruta de redirección pública de Mercado Pago (debe ir ANTES de cualquier validación restrictiva)
router.get('/mp-redirect', handleMpRedirect);

// Rutas de Socio (requiere autenticación general) + rate limit + validación de monto
router.post('/campanas/:id/donar-transferencia', authenticateJWT, donationLimiter, validateDonation, declararTransferencia);
router.post('/campanas/:id/donar-mp', authenticateJWT, donationLimiter, validateDonation, crearDonacionMercadoPago);
router.get('/mis-donaciones', authenticateJWT, getMyDonaciones);

// Rutas de Administración (requiere rol de admin)
router.get('/transferencias', authenticateJWT, authorizeRoles('admin'), getTransferencias);
router.put('/transferencias/:id/aprobar', authenticateJWT, authorizeRoles('admin'), aprobarTransferencia);
router.put('/transferencias/:id/rechazar', authenticateJWT, authorizeRoles('admin'), rechazarTransferencia);

export default router;
