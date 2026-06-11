import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectSQL } from './config/db.js';
import { connectMongoDB } from './config/mongo.js';
import sequelize from './config/db.js';
import { globalLimiter } from './middleware/rateLimiter.js';

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

// Middlewares globales
// Configuración estricta de CORS
const allowedOrigins = [
  'http://localhost:3000',      // Local
  'http://localhost:5173',      // Local Vite
  process.env.FRONTEND_URL      // URL de Producción (Vercel)
].filter(Boolean); // Filtra los undefined si FRONTEND_URL no está en el .env

app.use(cors({
  origin: function (origin, callback) {
    // Permite peticiones sin origin (como herramientas de testeo local o curl) y orígenes permitidos
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy: Acceso denegado.'));
    }
  },
  credentials: true // Permite envío de cookies/tokens si fuera necesario
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
})); // Añade cabeceras HTTP de seguridad y permite cargar imágenes desde otros dominios (CORS/CORP)
app.use(express.json());
app.use(cookieParser()); // Para leer cookies de sesión
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

// Servir archivos subidos estáticamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

