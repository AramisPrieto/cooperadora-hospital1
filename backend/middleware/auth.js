import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}


import Usuario from '../models/Usuario.js';

// Middleware principal de autenticación
export const authenticateJWT = async (req, res, next) => {
  let token = req.cookies?.token; // Prioridad a la cookie

  // Fallback opcional por si el token viene en header de todos modos (para compatibilidad temporal)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Acceso denegado',
      message: 'Token de autenticación no provisto.'
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token provisto es inválido o ha expirado.'
    });
  }

  try {
    let userRole = decoded.rol;

    // Si el token tiene versión, validar que no haya sido revocado
    if (decoded.token_version !== undefined) {
      const userRecord = await Usuario.findByPk(decoded.id, { attributes: ['id', 'token_version', 'rol'] });
      if (!userRecord || (userRecord.token_version ?? 0) !== (decoded.token_version ?? 0)) {
        return res.status(401).json({
          error: 'Sesión revocada',
          message: 'La sesión ha expirado o ha sido revocada por un cambio de credenciales.'
        });
      }
      if (userRecord.rol) {
        userRole = userRecord.rol;
      }
    }

    // Agregamos la información del usuario desencriptada al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: userRole
    };
    next();
  } catch (dbError) {
    console.error('Error al validar sesión en base de datos:', dbError);
    return res.status(500).json({
      error: 'Error interno',
      message: 'Error al verificar la validez de la sesión.'
    });
  }
};

// Middleware para validar roles específicos (por ejemplo, Admin)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debe autenticarse antes de realizar esta acción.'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        message: 'Su usuario no posee el rol necesario para realizar esta acción.'
      });
    }

    next();
  };
};
