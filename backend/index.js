import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';
import { connectSQL } from './config/db.js';
import { connectMongoDB } from './config/mongo.js';
import sequelize from './config/db.js';
import { globalLimiter } from './middleware/rateLimiter.js';

// Importar modelos para asegurar que Sequelize los registre
import './models/index.js';

// Importar Rutas
import authRoutes from './routes/authRoutes.js';
import socioRoutes from './routes/socioRoutes.js';
import campanaRoutes from './routes/campanaRoutes.js';
import noticiaRoutes from './routes/noticiaRoutes.js';
import donacionRoutes from './routes/donacionRoutes.js'; // TEAM_001: Importamos las rutas de transferencias

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(mongoSanitize());      // Sanitiza req.body/params/query — bloquea NoSQL injection
app.use('/api', globalLimiter); // Rate limit global: 100 req / 15 min por IP

// Log de peticiones simple en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Montar Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/socios', socioRoutes);
app.use('/api/campanas', campanaRoutes);
app.use('/api/noticias', noticiaRoutes);
app.use('/api/donaciones', donacionRoutes); // TEAM_001: Montamos las rutas en /api/donaciones


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

startServer();
