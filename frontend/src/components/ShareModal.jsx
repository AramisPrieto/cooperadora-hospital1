import React, { useState, useEffect } from 'react';
import { X, Copy, Check, MessageCircle, Facebook, Send, Share2 } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, url, title, summary = '', imageUrl = '', shareMessage = '' }) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      setTimeout(() => {
        setShowToast(false);
      }, 2500);
    } catch (err) {
      console.error('Error al copiar el enlace: ', err);
    }
  };

  const domain = 'cooperadora-hospital.org';
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareMessage ? shareMessage : `${title} - Cooperadora Hospital Emilio Ferreyra`);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareMessage || title,
          url
        });
      } catch (err) {
        console.log('Error compartiendo nativo: ', err);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="bg-white w-full max-w-md rounded-[2rem] border border-slate-200 shadow-2xl p-6 sm:p-7 relative flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
              <Share2 className="h-4.5 w-4.5 text-brand-600" />
            </div>
            <h2 id="share-modal-title" className="text-lg font-display font-black text-slate-800 tracking-tight">
              Compartir publicación
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center border border-slate-150 transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Live Link Preview (Plantilla de Vista Previa) */}
        <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50 text-xs shadow-inner">
          {imageUrl ? (
            <div className="h-32 w-full overflow-hidden relative border-b border-slate-150 bg-slate-100 flex items-center justify-center">
              <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-24 w-full bg-gradient-to-r from-brand-600 to-brand-700 flex flex-col items-center justify-center border-b border-slate-150 px-4 text-center">
              <span className="text-white font-display font-black text-[10px] tracking-widest uppercase mb-1">
                Cooperadora Hospital
              </span>
              <span className="text-brand-100 text-[8px] font-bold tracking-wider uppercase">
                Emilio Ferreyra
              </span>
            </div>
          )}
          <div className="p-3.5 space-y-1 bg-white">
            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">
              {domain}
            </span>
            <h3 className="font-display font-black text-slate-800 text-xs line-clamp-1">
              {title}
            </h3>
            {summary && (
              <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 leading-normal">
                {summary}
              </p>
            )}
          </div>
        </div>

        {/* Social Share Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 rounded-2xl transition-all group"
          >
            <MessageCircle className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">WhatsApp</span>
          </a>
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 rounded-2xl transition-all group"
          >
            <Facebook className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black text-blue-800 uppercase tracking-wider">Facebook</span>
          </a>
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-900 hover:bg-black border border-slate-900 rounded-2xl transition-all group"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-white fill-current group-hover:scale-110 transition-transform"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-[9px] font-black text-white uppercase tracking-wider">X (Twitter)</span>
          </a>
          <a
            href={shareLinks.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 hover:border-cyan-200 rounded-2xl transition-all group"
          >
            <Send className="h-5 w-5 text-cyan-600 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black text-cyan-800 uppercase tracking-wider">Telegram</span>
          </a>
        </div>

        {/* Copy Link Input Section */}
        <div className="space-y-1.5 mt-1">
          <label htmlFor="share-url-input" className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
            Copiar enlace
          </label>
          <div className="relative flex items-center">
            <input
              id="share-url-input"
              type="text"
              readOnly
              value={url}
              onClick={(e) => e.target.select()}
              className="w-full pr-24 pl-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 focus:outline-none focus:bg-white focus:border-slate-350 transition-all shadow-inner"
            />
            <button
              onClick={handleCopy}
              className={`absolute right-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-250 flex items-center gap-1 shadow-sm ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optional Native Share button */}
        {navigator.share && (
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm mt-1"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-500" />
            Más opciones del sistema
          </button>
        )}

        {/* Toast confirmation */}
        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-lg border border-emerald-500/25 flex items-center gap-1.5 transition-all duration-300 pointer-events-none ${
            showToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          ¡Enlace copiado con éxito!
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
