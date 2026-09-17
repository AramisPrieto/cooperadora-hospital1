import rateLimit from 'express-rate-limit';

// Mensaje de error genérico reutilizable
const tooManyRequestsHandler = (req, res) => {
  res.status(429).json({
    error: 'Demasiadas solicitudes desde esta IP. Por favor, intentá de nuevo más tarde.'
  });
};

// Helper para validar si debe saltearse el rate limiter de forma segura
const shouldSkip = (req) => {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return true;
  }
  const qaKey = process.env.QA_BYPASS_KEY;
  if (qaKey && req.headers['x-qa-bypass'] === qaKey) {
    return true;
  }
  return false;
};

/**
 * globalLimiter — Se aplica a toda la API como primera línea de defensa.
 * 1000 requests por IP cada 15 minutos (permite navegación fluida y tráfico compartido en proxies/presentaciones).
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000,
  standardHeaders: true,  // Devuelve info de límite en headers RateLimit-*
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
  skip: shouldSkip,
});

/**
 * authLimiter — Protege los endpoints de login y registro contra brute force.
 * 50 requests por IP cada 15 minutos.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
  skip: shouldSkip,
});

/**
 * donationLimiter — Evita spam de donaciones desde la misma IP.
 * 50 requests por IP cada hora.
 */
export const donationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Límite de donaciones alcanzado. Podés intentarlo de nuevo en una hora.'
    });
  },
  skip: shouldSkip,
});

/**
 * transactionLimiter — Evita spam de operaciones de pago o suscripciones.
 * 50 requests por IP cada 15 minutos.
 */
export const transactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Límite de transacciones alcanzado. Por favor, intentá de nuevo más tarde.'
    });
  },
  skip: shouldSkip,
});

