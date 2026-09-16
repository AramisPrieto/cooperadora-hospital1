import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno.');
  process.exit(1);
}

const isRenderHost = () => {
  try {
    const parsed = new URL(dbUrl);
    return parsed.hostname === 'render.com' || parsed.hostname.endsWith('.render.com');
  } catch {
    return false;
  }
};

const sslOptions = () => {
  if (process.env.NODE_ENV !== 'production' && !isRenderHost()) {
    return false;
  }
  if (process.env.DB_CA_CERT) {
    return {
      require: true,
      rejectUnauthorized: true,
      ca: [process.env.DB_CA_CERT]
    };
  }
  console.warn('⚠️ Advertencia: Conectando a la DB con cifrado SSL pero sin validación de firmas de certificados (rejectUnauthorized: false).');
  return {
    require: true,
    rejectUnauthorized: false
  };
};

// Inicializar Sequelize con la URL provista y configuración explícita de Connection Pool
const sequelize = new Sequelize(dbUrl, {
  dialectOptions: {
    ssl: sslOptions()
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});


export const connectSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a la Base de Datos Relacional (SQL).');
    return sequelize;
  } catch (error) {
    console.error('❌ Error de conexión a la Base de Datos SQL:', error.message);
    throw error;
  }
};

export default sequelize;
