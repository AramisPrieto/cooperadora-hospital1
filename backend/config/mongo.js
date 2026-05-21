import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ Error: MONGODB_URI no está definida en las variables de entorno.');
  process.exit(1);
}

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Conexión exitosa a MongoDB (NoSQL).');
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB:', error.message);
    throw error;
  }
};

export default mongoose.connection;
