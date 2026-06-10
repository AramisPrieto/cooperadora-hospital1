import dotenv from 'dotenv';

// Cargar variables de entorno del archivo .env original
dotenv.config();

// Sobrescribir variables de entorno para usar bases de datos de test dedicadas
process.env.NODE_ENV = 'test';
process.env.PORT = '5002'; // Evita pisar el puerto del servidor de desarrollo
process.env.BYPASS_WEBHOOK_SIGNATURE = 'true'; // Permitir bypass de firmas en webhooks de Mercado Pago durante los tests

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

