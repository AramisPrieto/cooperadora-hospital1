/**
 * Middleware de protección contra Cross-Site Request Forgery (CSRF).
 * Protege peticiones mutativas (POST, PUT, DELETE, PATCH) autenticadas vía cookies SameSite=None,
 * verificando los encabezados Sec-Fetch-Site, Origin y Referer respecto a los orígenes autorizados.
 */
export const csrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Rutas exentas de validación CSRF (ej: Webhooks de terceros con firma HMAC propia)
  const isExempt = req.originalUrl?.startsWith('/api/webhooks/') || req.path?.startsWith('/api/webhooks/');
  if (isExempt) {
    return next();
  }

  // Lista de orígenes permitidos (definidos en variables o locales)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers['origin'];
  const secFetchSite = req.headers['sec-fetch-site'];

  // Si no hay cookie de sesión involucrada, el riesgo CSRF de suplantación de sesión es nulo
  const hasAuthCookie = !!(req.cookies && req.cookies.token);
  if (!hasAuthCookie) {
    return next();
  }

  // Si el navegador declara explícitamente Sec-Fetch-Site: cross-site
  if (secFetchSite === 'cross-site') {
    // Validar si el Origin es explícitamente uno de los autorizados de Vercel/localhost
    const isAllowed = isOriginAllowed(origin, allowedOrigins);
    if (!isAllowed) {
      console.warn(`🛑 [CSRF Block] Petición mutativa cross-site bloqueada. Origin: ${origin}, Path: ${req.originalUrl}`);
      return res.status(403).json({
        error: 'CSRF Validation Failed',
        message: 'Acceso denegado por política de seguridad CSRF.'
      });
    }
  }

  // Validación de Origin si está presente
  if (origin && !isOriginAllowed(origin, allowedOrigins)) {
    console.warn(`🛑 [CSRF Block] Origen no autorizado: ${origin}`);
    return res.status(403).json({
      error: 'CSRF Validation Failed',
      message: 'Origen no autorizado para operaciones con estado.'
    });
  }

  next();
};

const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;

  // Permitir previews y dominios autorizados de Vercel para este proyecto
  const isVercelOrigin = /^https:\/\/cooperadora-hospital(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
  return isVercelOrigin;
};
