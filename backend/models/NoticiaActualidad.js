import mongoose from 'mongoose';

const noticiaActualidadSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  cuerpo_html: {
    type: String,
    required: true
  },
  multimedia: {
    type: [String],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  imagen_url: {
    type: String,
    default: ''
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'noticias_actualidad',
  timestamps: true
});

// Índices explícitos para optimizar búsquedas por palabra clave y ordenamiento cronológico
noticiaActualidadSchema.index({ titulo: 'text', cuerpo_html: 'text' });
noticiaActualidadSchema.index({ fecha: -1 });

const NoticiaActualidad = mongoose.model('NoticiaActualidad', noticiaActualidadSchema);

export default NoticiaActualidad;
