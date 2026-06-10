import NodeCache from 'node-cache';

// stdTTL: Tiempo de vida en segundos (5 minutos por defecto)
const cache = new NodeCache({ stdTTL: 300 });

export const cacheMiddleware = (req, res, next) => {
  // Solo cacheamos peticiones GET
  if (req.method !== 'GET') {
    return next();
  }

  // La URL original sirve como clave de caché
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log(`[Cache Hit] ${key}`);
    return res.json(cachedResponse);
  } else {
    console.log(`[Cache Miss] ${key}`);
    // Interceptamos la respuesta JSON para guardarla en la caché antes de enviarla
    res.originalJson = res.json;
    res.json = (body) => {
      cache.set(key, body);
      res.originalJson(body);
    };
    next();
  }
};
