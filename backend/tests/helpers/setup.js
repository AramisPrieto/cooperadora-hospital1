import './env.js';
import pg from 'pg';
import mongoose from 'mongoose';
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
