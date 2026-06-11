import rateLimit from 'express-rate-limit';

// Mensaje de error genérico reutilizable
const tooManyRequestsHandler = (req, res) => {
  res.status(429).json({
    error: 'Demasiadas solicitudes desde esta IP. Por favor, intentá de nuevo más tarde.'
  });
};

/**
 * globalLimiter — Se aplica a toda la API como primera línea de defensa.
 * 100 requests por IP cada 15 minutos.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,  // Devuelve info de límite en headers RateLimit-*
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

/**
 * authLimiter — Protege los endpoints de login y registro contra brute force.
 * 10 requests por IP cada 15 minutos.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

/**
 * donationLimiter — Evita spam de donaciones desde la misma IP.
 * 5 requests por IP cada hora.
 */
export const donationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Límite de donaciones alcanzado. Podés intentarlo de nuevo en una hora.'
    });
  },
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});

