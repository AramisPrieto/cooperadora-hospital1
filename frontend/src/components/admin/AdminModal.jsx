import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * AdminModal - Diálogo flotante bloqueante y responsivo para el panel de administración.
 * 
 * @param {boolean} isOpen - Controla la visibilidad del modal
 * @param {function} onClose - Callback al cerrar el modal
 * @param {string} title - Título del diálogo
 * @param {string} [subtitle] - Subtítulo explicativo opcional
 * @param {string} [maxWidth] - Clase de ancho máximo (ej. 'max-w-3xl', 'max-w-xl')
 * @param {React.ReactNode} children - Contenido del formulario o vista
 * @param {boolean} [closeOnBackdrop=true] - Si permite cerrar haciendo clic en el fondo
 */
export const AdminModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-3xl',
  children,
  closeOnBackdrop = true
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade overflow-y-auto"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <div
        className={`relative w-full ${maxWidth} my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-scale-up border border-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera fija del Modal (opcional si el hijo no tiene la suya) */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-white sticky top-0 z-20 shrink-0">
            <div>
              <h3
                id="admin-modal-title"
                className="text-base sm:text-lg font-display font-black text-slate-800"
              >
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Contenido con scroll interno vertical */}
        <div className="overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
