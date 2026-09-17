import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLenis } from 'lenis/react';

/**
 * AdminModal - Diálogo flotante bloqueante y responsivo para el panel de administración.
 * Integrado con Lenis (data-lenis-prevent y scroll-lock) para permitir desplazamiento nativo fluido.
 * 
 * @param {boolean} isOpen - Controla la visibilidad del modal
 * @param {function} onClose - Callback al cerrar el modal
 * @param {string} [title] - Título del diálogo opcional
 * @param {string} [subtitle] - Subtítulo explicativo opcional
 * @param {string} [maxWidth='max-w-3xl'] - Ancho máximo del contenedor (ej. 'max-w-4xl', 'max-w-2xl')
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
  const lenis = useLenis();

  useEffect(() => {
    if (!isOpen) return;

    if (lenis) lenis.stop();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (lenis) lenis.start();
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, lenis]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-fade overflow-y-auto"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'admin-modal-title' : undefined}
      data-lenis-prevent
    >
      <div
        className={`relative w-full ${maxWidth} my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-scale-up border border-slate-200/80 flex flex-col max-h-[92dvh] sm:max-h-[88vh]`}
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
      >
        {/* Cabecera fija del Modal (opcional si el hijo no tiene la suya) */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-100 bg-white sticky top-0 z-20 shrink-0">
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

        {/* Contenido con scroll interno vertical y contención de scroll */}
        <div 
          className="overflow-y-auto overscroll-contain flex-1 flex flex-col min-h-0"
          data-lenis-prevent
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
