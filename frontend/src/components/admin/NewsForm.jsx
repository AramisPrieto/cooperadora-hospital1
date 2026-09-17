import React, { useState } from 'react';
import { X, Save, Newspaper, Pencil } from 'lucide-react';
import FileUpload from '../FileUpload';

const FormLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
    {children}
  </label>
);

const inputCls = "input-field";

const NewsForm = ({ news, newsItem, onSave, onCancel, submitting }) => {
  const currentNews = news || newsItem;
  const isEditing = !!currentNews;

  const [form, setForm] = useState({
    titulo: currentNews?.titulo || '',
    cuerpo_html: currentNews?.cuerpo_html || '',
    fecha: currentNews?.fecha ? currentNews.fecha.split('T')[0] : '',
    imagen_url: currentNews?.imagen_url || ''
  });

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedForm = {
      titulo: (form.titulo || '').trim(),
      cuerpo_html: (form.cuerpo_html || '').trim(),
      fecha: form.fecha ? form.fecha : null,
      imagen_url: (form.imagen_url || '').trim()
    };
    onSave(cleanedForm);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 flex-1">
      {/* ── Cabecera Fija Superior ── */}
      <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-100 bg-white sticky top-0 z-20 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-accent-50 border border-accent-100/80 flex items-center justify-center text-accent-600 shrink-0">
            {isEditing ? <Pencil className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-display font-black text-slate-800">
                {isEditing ? '✏️ Editar Noticia' : '+ Nueva Noticia'}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-accent-700 bg-accent-50 border border-accent-200/60 px-2 py-0.5 rounded-md hidden sm:inline-block">
                {isEditing ? 'Edición' : 'Novedad'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing
                ? `Actualice el contenido de "${currentNews?.titulo || 'noticia'}"`
                : 'Redacte y publique un nuevo artículo o comunicado institucional.'}
            </p>
          </div>
        </div>
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={submitting}
          aria-label="Cerrar"
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors disabled:opacity-40 shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Cuerpo con Scroll Fluido y data-lenis-prevent ── */}
      <div 
        className="p-6 sm:p-8 space-y-6 overflow-y-auto overscroll-contain flex-1 min-h-0 bg-slate-50/40"
        data-lenis-prevent
      >
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div>
            <FormLabel htmlFor="titulo">Título de la Noticia *</FormLabel>
            <input 
              id="titulo"
              type="text" 
              required 
              maxLength={255}
              value={form.titulo} 
              onChange={e => handleChange('titulo', e.target.value)} 
              className={inputCls} 
              placeholder="Ej: Nuevo equipamiento médico incorporado en pediatría" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="fecha">Fecha de Publicación</FormLabel>
              <input 
                id="fecha"
                type="date" 
                value={form.fecha} 
                onChange={e => handleChange('fecha', e.target.value)} 
                className={inputCls} 
              />
            </div>
          </div>

          <div>
            <FormLabel htmlFor="cuerpo_html">
              Cuerpo / Contenido <span className="normal-case text-slate-400 font-normal ml-1">(HTML permitido)</span> *
            </FormLabel>
            <textarea
              id="cuerpo_html"
              required 
              maxLength={50000}
              rows={8} 
              value={form.cuerpo_html}
              onChange={e => handleChange('cuerpo_html', e.target.value)}
              placeholder="<p>Escriba aquí los párrafos o detalles de la noticia...</p>"
              className={`${inputCls} font-mono resize-y min-h-[140px]`}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <FileUpload
              tipo="imagen"
              value={form.imagen_url}
              onChange={val => handleChange('imagen_url', val)}
              label="Imagen de portada (opcional)"
            />
          </div>
        </div>
      </div>

      {/* ── Pie Fijo Inferior con Acciones ── */}
      <div className="px-6 py-4 sm:px-8 sm:py-4 bg-white border-t border-slate-200/80 sticky bottom-0 z-20 shrink-0 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <span className="text-[11px] text-slate-400 font-medium">
          * Campos requeridos para guardar
        </span>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            className="btn-accent w-full sm:w-auto px-6 py-2.5 shine disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Publicar Noticia')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default NewsForm;
