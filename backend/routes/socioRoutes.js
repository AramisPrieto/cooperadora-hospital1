import express from 'express';
import {
  getAllSocios,
  getMyProfile,
  getMyCuotas,
  createSocio,
  updateSocio,
  deleteSocio
} from '../controllers/socioController.js';
import {
  iniciarSuscripcion,
  cancelarSuscripcion,
  obtenerMiHistorialPagos,
  declararPagoTransferencia,
  handleSocioMpRedirect
} from '../controllers/socioSubscriptionController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Ruta de redirección pública de Mercado Pago (debe ir ANTES del middleware JWT)
router.get('/mp-redirect', handleSocioMpRedirect);

// Todas las rutas siguientes requieren inicio de sesión con JWT (Cero Anonimato)
router.use(authenticateJWT);

// Autogestión: Ver propio perfil de socio
router.get('/mi-perfil', getMyProfile);

// Autogestión: Ver historial de cuotas pagadas/pendientes del socio
router.get('/mi-perfil/cuotas', getMyCuotas);

// Autogestión: Ver historial de pagos de cuotas
router.get('/mi-perfil/pagos', obtenerMiHistorialPagos);

// Autogestión: Declarar pago de cuota por transferencia
router.post('/mi-perfil/pagos/declarar', declararPagoTransferencia);

// Autogestión: Gestión de suscripción Mercado Pago
router.post('/suscripcion/crear', iniciarSuscripcion);
router.post('/suscripcion/cancelar', cancelarSuscripcion);

// Autogestión / Admin: Actualizar perfil de socio (Socio edita su DNI, Admin edita todo y estado)
router.put('/:id', updateSocio);

// Rutas exclusivas de Administrador
router.get('/', authorizeRoles('admin'), getAllSocios);
router.post('/', authorizeRoles('admin'), createSocio);
router.delete('/:id', authorizeRoles('admin'), deleteSocio);

export default router;
