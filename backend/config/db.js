import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno.');
  process.exit(1);
}

const sslOptions = () => {
  if (process.env.NODE_ENV !== 'production' && !dbUrl.includes('render.com')) {
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

// Inicializar Sequelize con la URL provista
const sequelize = new Sequelize(dbUrl, {
  dialectOptions: {
    ssl: sslOptions()
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
