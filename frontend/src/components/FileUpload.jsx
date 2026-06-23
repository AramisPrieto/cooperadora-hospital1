/**
 * FileUpload — Componente de subida de archivos con drag & drop y click
 * Props:
 *   tipo: 'imagen' | 'comprobante'
 *   value: string (URL actual)
 *   onChange: (url: string) => void
 *   accept: string (MIME types o extensiones)
 *   label: string
 *   className: string (extra classes para el wrapper)
 */
import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image, FileText } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import api from '../api/axios';

const FileUpload = ({
  tipo = 'imagen',
  value = '',
  onChange,
  label = 'Subir archivo',
  accept,
  className = ''
}) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(value || '');
  const inputRef = useRef(null);
  const inputId = useId();

  // Sync preview with value when it changes externally
  useEffect(() => {
    setPreview(value || '');
  }, [value]);

  const isImage = tipo === 'imagen';
  const defaultAccept = isImage
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : 'image/jpeg,image/png,image/webp,application/pdf';

  const uploadFile = useCallback(async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);

    let fileToUpload = file;

    // Compresión y Preview local inmediato para imágenes
    if (file.type.startsWith('image/')) {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(file, options);
      } catch (error) {
        console.warn('Error al comprimir la imagen:', error);
      }

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(fileToUpload);
    }

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const res = await api.post(`/uploads?tipo=${tipo}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onChange(res.data.url);
      setPreview(res.data.url);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al subir el archivo. Máximo 8MB.';
      setError(msg);
      setPreview(value || '');
    } finally {
      setUploading(false);
    }
  }, [tipo, onChange, value]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview('');
    onChange('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasFile = !!preview;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
          {label}
        </label>
      )}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
          ${dragging
            ? 'border-brand-400 bg-brand-50 scale-[1.01]'
            : hasFile
              ? 'border-emerald-300 bg-emerald-50/50'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
          }
          ${uploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        {/* Preview de imagen */}
        {hasFile && isImage && preview.match(/^(https?|data:image|\/uploads)/) ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-40 object-cover"
              onError={() => console.warn("Failed to load image preview:", preview)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <span className="text-white text-xs font-black">Cambiar imagen</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              aria-label="Quitar imagen"
              className="absolute top-2 right-2 h-7 w-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-slate-600 hover:text-rose-600 shadow-sm transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : hasFile ? (
          /* Preview de comprobante (PDF o no-imagen) */
          <div className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm font-bold text-slate-700 truncate">Archivo subido correctamente</p>
              <p className="text-[11px] text-slate-400 truncate">{preview}</p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              aria-label="Quitar archivo"
              className="h-7 w-7 flex items-center justify-center rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
            {uploading ? (
              <>
                <div className="h-8 w-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Subiendo archivo…</p>
              </>
            ) : (
              <>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${dragging ? 'bg-brand-100' : 'bg-slate-100'}`}>
                  {isImage
                    ? <Image className={`h-6 w-6 ${dragging ? 'text-brand-600' : 'text-slate-400'}`} />
                    : <Upload className={`h-6 w-6 ${dragging ? 'text-brand-600' : 'text-slate-400'}`} />
                  }
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600">
                    {dragging ? 'Soltar aquí' : 'Arrastrá o hacé click'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isImage ? 'JPG, PNG, WEBP · Máx. 8MB' : 'JPG, PNG, PDF · Máx. 8MB'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Overlay de drag activo */}
        {dragging && !hasFile && (
          <div className="absolute inset-0 border-2 border-brand-400 rounded-2xl pointer-events-none" />
        )}
      </div>

      {/* Input oculto */}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept || defaultAccept}
        onChange={handleChange}
        className="hidden"
        aria-label={label || 'Subir archivo'}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-rose-600 text-[11px] font-semibold">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Éxito */}
      {hasFile && !error && !uploading && (
        <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-semibold">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          Archivo listo
        </div>
      )}
    </div>
  );
};

export default FileUpload;
