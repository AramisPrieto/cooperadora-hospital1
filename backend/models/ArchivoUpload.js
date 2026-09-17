import mongoose from 'mongoose';

const archivoUploadSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  originalname: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  tipo: { type: String, enum: ['comprobante', 'imagen'], default: 'comprobante' },
  data: { type: Buffer, required: true }
}, {
  timestamps: true,
  collection: 'archivos_uploads'
});

const ArchivoUpload = mongoose.model('ArchivoUpload', archivoUploadSchema);

export default ArchivoUpload;
