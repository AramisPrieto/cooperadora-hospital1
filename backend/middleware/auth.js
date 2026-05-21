import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware principal de autenticación
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso denegado',
      message: 'Token de autenticación no provisto o con formato inválido.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Agregamos la información del usuario desencriptada al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Token inválido',
      message: 'El token provisto es inválido o ha expirado.'
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
