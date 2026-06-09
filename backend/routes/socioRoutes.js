import express from 'express';
import {
  getAllSocios,
  getMyProfile,
  getMyCuotas,
  createSocio,
  updateSocio,
  deleteSocio
} from '../controllers/socioController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren inicio de sesión con JWT (Cero Anonimato)
router.use(authenticateJWT);

// Autogestión: Ver propio perfil de socio
router.get('/mi-perfil', getMyProfile);

// Autogestión: Ver historial de cuotas pagadas/pendientes del socio
router.get('/mi-perfil/cuotas', getMyCuotas);

// Autogestión / Admin: Actualizar perfil de socio (Socio edita su DNI, Admin edita todo y estado)
router.put('/:id', updateSocio);

// Rutas exclusivas de Administrador
router.get('/', authorizeRoles('admin'), getAllSocios);
router.post('/', authorizeRoles('admin'), createSocio);
router.delete('/:id', authorizeRoles('admin'), deleteSocio);

export default router;
