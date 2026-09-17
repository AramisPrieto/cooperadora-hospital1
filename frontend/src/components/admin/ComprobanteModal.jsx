import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Loader2, FileText } from 'lucide-react';

export const resolveComprobanteUrl = (rawUrl) => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  if (trimmed.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_URL || '';
    if (apiBase.startsWith('http')) {
      try {
        const backendOrigin = new URL(apiBase).origin;
        return `${backendOrigin}${trimmed}`;
      } catch (e) {
        return trimmed;
      }
    }
    return trimmed;
  }
  return trimmed;
};

export const ComprobanteModal = ({
  url,
  numeroComprobante = '',
  title = 'Comprobante Adjunto',
  onClose
}) => {
  const resolvedUrl = resolveComprobanteUrl(url);
  const isPdf = Boolean(resolvedUrl && resolvedUrl.toLowerCase().includes('.pdf'));
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(isPdf);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isPdf || !resolvedUrl) {
      setBlobUrl(null);
      setLoading(false);
      setError(false);
      return;
    }

    let isMounted = true;
    let createdUrl = null;

    setLoading(true);
    setError(false);

    fetch(resolvedUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (!isMounted) return;
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        createdUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(createdUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error al obtener comprobante vía Blob:', err);
        if (!isMounted) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [resolvedUrl, isPdf]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          title="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-wrap items-center justify-between mb-4 pr-10 gap-2">
          <div>
            <h3 className="font-display font-black text-slate-800 text-lg">{title}</h3>
            {numeroComprobante && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Nº de transacción / referencia: <strong className="font-mono text-slate-800 font-bold">#{numeroComprobante}</strong>
              </p>
            )}
          </div>
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir en nueva pestaña
          </a>
        </div>

        <div className="max-h-[70vh] min-h-[300px] overflow-auto rounded-xl border border-slate-100 flex items-center justify-center bg-slate-50">
          {error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="font-display font-black text-slate-800 text-base mb-1">
                Vista previa no disponible directamente
              </h4>
              <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                El archivo no pudo visualizarse directamente en el visor (puede haber sido purgado del almacenamiento temporal de la nube o presentar restricciones de acceso).
              </p>
              {numeroComprobante && (
                <div className="mb-4 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-mono text-slate-700 font-bold">
                  Referencia bancaria: #{numeroComprobante}
                </div>
              )}
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir comprobante en nueva pestaña
              </a>
            </div>
          ) : isPdf ? (
            loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500 mb-3" />
                <span className="text-sm font-semibold">Cargando comprobante PDF...</span>
              </div>
            ) : !blobUrl ? (
              <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6" />
                </div>
                <h4 className="font-display font-black text-slate-800 text-base mb-1">
                  Vista previa no disponible directamente
                </h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Por políticas de seguridad de origen o conectividad, podés visualizar o descargar el archivo original en una nueva pestaña.
                </p>
                <a
                  href={resolvedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir comprobante en nueva pestaña
                </a>
              </div>
            ) : (
              <iframe
                src={blobUrl}
                title={title}
                className="w-full h-[65vh] rounded-xl border-none"
              />
            )
          ) : (
            <img
              src={resolvedUrl}
              alt={title}
              className="w-full object-contain max-h-[65vh] rounded-xl"
              onError={() => setError(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprobanteModal;
