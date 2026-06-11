import mongoose from 'mongoose';

const campanaDetalleSchema = new mongoose.Schema({
  campana_id_ref: {
    type: Number, // Hace referencia al ID numérico auto-incremental de SQL
    required: true,
    unique: true
  },
  testimonios: [
    {
      autor: { type: String, required: true },
      texto: { type: String, required: true },
      fecha: { type: Date, default: Date.now }
    }
  ],
  galeria_rica: {
    videos: { type: [String], default: [] },
    imagenes: { type: [String], default: [] }
  },
  obra_status: {
    type: String,
    required: true,
    default: 'Planeada'
  },
  equipamiento_info: {
    type: String,
    default: ''
  },
  equipamiento_imagen: {
    type: String,
    default: ''
  }
}, {
  collection: 'campanas_detalle',
  timestamps: true
});

const CampanaDetalle = mongoose.model('CampanaDetalle', campanaDetalleSchema);

export default CampanaDetalle;
