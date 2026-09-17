import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carpeta de uploads: backend/uploads/
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Tipos MIME permitidos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/pdf'
];

// Mapeo seguro de tipos MIME a extensiones
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.query.tipo === 'comprobante' ? 'comprobantes' : 'imagenes';
    const dest = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext && MIME_TO_EXT[file.mimetype]) {
      ext = MIME_TO_EXT[file.mimetype];
    }
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext || '.jpg'}`;
    cb(null, unique);
  }
});

// Extensiones permitidas correlacionadas
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_DOC_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const fileFilter = (req, file, cb) => {
  let ext = path.extname(file.originalname || '').toLowerCase();
  if (!ext && MIME_TO_EXT[file.mimetype]) {
    ext = MIME_TO_EXT[file.mimetype];
  }
  const isComprobante = req.query.tipo === 'comprobante';
  const allowedMime = isComprobante ? ALLOWED_DOC_TYPES : ALLOWED_IMAGE_TYPES;
  const allowedExt = isComprobante ? ALLOWED_DOC_EXTENSIONS : ALLOWED_IMAGE_EXTENSIONS;

  if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    const errorMsg = isComprobante
      ? 'Formato de comprobante no admitido. Por favor suba un archivo en formato JPG, PNG, WEBP o PDF.'
      : 'Formato de imagen no admitido. Por favor seleccione una imagen válida en formato JPG, PNG, WEBP o GIF.';
    const err = new Error(errorMsg);
    err.status = 400;
    cb(err, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 } // 8 MB máximo
});

import ArchivoUpload from '../models/ArchivoUpload.js';

// POST /api/uploads?tipo=imagen|comprobante
export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  }

  // Construir la URL pública del archivo
  const folder = req.query.tipo === 'comprobante' ? 'comprobantes' : 'imagenes';
  const url = `${req.protocol}://${req.get('host')}/uploads/${folder}/${req.file.filename}`;

  // Persistir en MongoDB Atlas para tolerancia ante reinicios de disco en la nube (Render)
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    await ArchivoUpload.create({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      tipo: req.query.tipo === 'comprobante' ? 'comprobante' : 'imagen',
      data: fileBuffer
    });
  } catch (dbErr) {
    console.warn('Advertencia: No se pudo respaldar archivo en MongoDB Atlas:', dbErr.message);
  }

  return res.status(201).json({
    url,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
};

// GET /uploads/:folder/:filename con fallback a MongoDB Atlas
export const serveUploadedFile = async (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(UPLOAD_DIR, folder, filename);

  // 1. Si existe en el disco local, servirlo directamente
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', 'inline');
    return res.sendFile(filePath);
  }

  // 2. Si no existe en disco local (Render reinició la instancia), recuperarlo de MongoDB Atlas
  try {
    const doc = await ArchivoUpload.findOne({ filename });
    if (doc && doc.data) {
      // Re-escribir en disco local como caché
      try {
        const destFolder = path.join(UPLOAD_DIR, folder);
        if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
        fs.writeFileSync(filePath, doc.data);
      } catch (cacheErr) {
        console.warn('No se pudo escribir en disco local caché:', cacheErr.message);
      }

      res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', 'inline');
      return res.send(doc.data);
    }
  } catch (mongoErr) {
    console.error('Error al recuperar comprobante de MongoDB Atlas:', mongoErr.message);
  }

  return res.status(404).json({ error: 'Archivo de comprobante no encontrado.' });
};

