import dotenv from 'dotenv';
import pg from 'pg';
import mongoose from 'mongoose';

// Cargar variables de entorno del archivo .env original
dotenv.config();

// Sobrescribir variables de entorno para usar bases de datos de test dedicadas
process.env.NODE_ENV = 'test';
process.env.PORT = '5002'; // Evita pisar el puerto del servidor de desarrollo

if (process.env.DATABASE_URL) {
  const urlObj = new URL(process.env.DATABASE_URL);
  if (!urlObj.pathname.endsWith('_test')) {
    urlObj.pathname = urlObj.pathname + '_test';
  }
  process.env.DATABASE_URL = urlObj.toString();
} else {
  process.env.DATABASE_URL = 'postgres://postgres:admin123@localhost:5435/cooperadora_db_test';
}

if (process.env.MONGODB_URI) {
  const urlObj = new URL(process.env.MONGODB_URI);
  if (!urlObj.pathname.endsWith('_test')) {
    urlObj.pathname = urlObj.pathname + '_test';
  }
  process.env.MONGODB_URI = urlObj.toString();
} else {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/cooperadora_nosql_test';
}

// Ahora importamos las configuraciones de bases de datos
import sequelize from '../../config/db.js';
import { connectMongoDB } from '../../config/mongo.js';

export const initTestDatabase = async () => {
  const connectionUrl = process.env.DATABASE_URL;
  const urlObj = new URL(connectionUrl);
  const targetDbName = urlObj.pathname.substring(1);
  
  // Conectar a base de datos por defecto 'postgres' para crear la de test si no existe
  urlObj.pathname = '/postgres';
  const client = new pg.Client({
    connectionString: urlObj.toString(),
  });
  
  await client.connect();
  try {
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDbName]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Base de datos SQL de test '${targetDbName}' creada.`);
    }
  } catch (error) {
    console.error(`❌ Error al crear la base de datos '${targetDbName}':`, error.message);
  } finally {
    await client.end();
  }

  // Conectar Sequelize y MongoDB
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // Sincroniza tablas limpias

  if (mongoose.connection.readyState === 0) {
    await connectMongoDB();
  }
};

export const resetTestDatabase = async () => {
  // Truncar todas las tablas SQL
  await sequelize.query('TRUNCATE TABLE "donaciones_transferencia", "perfiles_socios", "campanas_eco", "usuarios", "pagos_cuotas" CASCADE;');
  
  // Limpiar MongoDB
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

export const closeTestConnections = async () => {
  await sequelize.close();
  await mongoose.connection.close();
};
