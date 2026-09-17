import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectSQL } from './config/db.js';
import { connectMongoDB } from './config/mongo.js';
import sequelize from './config/db.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { csrfProtection } from './middleware/csrfProtection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Importar modelos para asegurar que Sequelize los registre
import './models/index.js';

// Importar Rutas
import authRoutes from './routes/authRoutes.js';
import socioRoutes from './routes/socioRoutes.js';
import campanaRoutes from './routes/campanaRoutes.js';
import noticiaRoutes from './routes/noticiaRoutes.js';
import donacionRoutes from './routes/donacionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { webhookMercadoPago } from './controllers/socioSubscriptionController.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
app.set('trust proxy', 1); // Confiar en el proxy reverso (Render/Vercel) para la lectura correcta de IPs en express-rate-limit
const PORT = process.env.PORT || 5000;

// Deshabilitar la cabecera X-Powered-By de Express para ocultar la tecnología del servidor
app.disable('x-powered-by');

// Middlewares globales
// Configuración estricta de CORS
const allowedOrigins = [
  'http://localhost:3000',      // Local
  'http://localhost:5173',      // Local Vite
  process.env.FRONTEND_URL      // URL de Producción (Vercel)
].filter(Boolean); // Filtra los undefined si FRONTEND_URL no está en el .env

app.use(cors({
  origin: function (origin, callback) {
    // Permite peticiones sin origin (como herramientas de testeo local, curl, Postman o peticiones del mismo origen/proxys)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Permitir únicamente subdominios .vercel.app específicos de este proyecto (incluyendo previews de Git)
    const isVercelOrigin = /^https:\/\/cooperadora-hospital(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
    if (isVercelOrigin) {
      return callback(null, true);
    }

    callback(new Error('CORS Policy: Acceso denegado.'));
  },
  credentials: true // Permite envío de cookies/tokens si fuera necesario
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  frameguard: {
    action: 'sameorigin' // Mitiga ataques de Clickjacking denegando la carga de frames de terceros
  }
})); // Añade cabeceras HTTP de seguridad
app.use(express.json());
// Parser nativo de cookies sin registrar middleware global cookie-parser (CWE-352)
app.use((req, res, next) => {
  req.cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach((cookieStr) => {
      const [name, ...val] = cookieStr.trim().split('=');
      if (name) {
        req.cookies[name] = decodeURIComponent(val.join('='));
      }
    });
  }
  next();
});
app.use(csrfProtection); // Mitigación estricta de ataques CSRF en peticiones mutativas
app.use(mongoSanitize());      // Sanitiza req.body/params/query — bloquea NoSQL injection
app.use('/api', globalLimiter); // Rate limit global: 100 req / 15 min por IP

// Log de peticiones simple en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

import { cacheMiddleware } from './middleware/cacheMiddleware.js';
import { serveUploadedFile } from './controllers/uploadController.js';

// Servir archivos subidos estáticamente con fallback a MongoDB Atlas
app.get('/uploads/:folder/:filename', (req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, serveUploadedFile);

app.use('/uploads', (req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Montar Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/socios', socioRoutes);
app.use('/api/campanas', cacheMiddleware, campanaRoutes);
app.use('/api/noticias', cacheMiddleware, noticiaRoutes);
app.use('/api/donaciones', donacionRoutes);
app.use('/api/uploads', uploadRoutes);
app.post('/api/webhooks/mercadopago', webhookMercadoPago);


// Ruta de estado de la API (Pública)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    services: {
      sql: 'Connected (Authenticated)',
      mongodb: 'Connected (Mongoose)'
    }
  });
});

// Manejo global de rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint no encontrado.' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo supera el tamaño máximo permitido (8 MB).' });
    }
    return res.status(400).json({ error: `Error en la subida del archivo: ${err.message}` });
  }
  if (err.status === 400 || (err.message && (err.message.includes('no admitid') || err.message.includes('no permitid') || err.message.includes('Formato') || err.message.includes('comprobante')))) {
    return res.status(err.status || 400).json({ error: err.message });
  }
  console.error('Error no controlado:', err.stack);
  res.status(500).json({ error: 'Ha ocurrido un error interno en el servidor.' });
});

// Inicializar Servidor y Bases de Datos
const startServer = async () => {
  try {
    // 1. Conectar base de datos SQL
    const sqlConnection = await connectSQL();

    // Sincronizar modelos relacionales (Crea tablas si no existen)
    // En producción se preferiría usar migraciones, pero para el entorno universitario sync es ideal.
    await sqlConnection.sync({ alter: true });
    console.log('✅ Tablas relacionales de SQL sincronizadas con éxito.');

    // 2. Conectar base de datos NoSQL
    await connectMongoDB();

    // 3. Iniciar escucha del servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
      console.log(`👉 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor backend:', error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;

