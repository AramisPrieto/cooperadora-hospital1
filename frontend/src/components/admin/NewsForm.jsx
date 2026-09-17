import React, { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import FileUpload from '../FileUpload';

const FormLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
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
      {/* ── Header idéntico al estilo DonationModal ── */}
      <div className="bg-slate-50 border-b border-slate-200 p-5 sm:p-6 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">
              {isEditing ? 'Editar Noticia' : 'Nueva Noticia'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {isEditing 
                ? (currentNews?.titulo || 'Actualice el contenido del comunicado') 
                : 'Redacte y publique un nuevo artículo en el portal'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={submitting}
            aria-label="Cerrar"
            className="shrink-0 h-8 w-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Cuerpo con Scroll Fluido y data-lenis-prevent ── */}
      <div 
        className="p-5 sm:p-6 md:p-8 overflow-y-auto overscroll-contain flex-1 min-h-0 bg-slate-50/30"
        data-lenis-prevent
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda: Metadatos e Imagen */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="h-2 w-2 rounded-full bg-accent-600" />
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                Información de la Noticia
              </h4>
            </div>

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
                placeholder="Ej: Nuevo equipamiento incorporado en maternidad" 
              />
            </div>

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

            <div className="pt-2 border-t border-slate-100">
              <FileUpload
                tipo="imagen"
                value={form.imagen_url}
                onChange={val => handleChange('imagen_url', val)}
                label="Imagen de Portada (opcional)"
              />
            </div>
          </div>

          {/* Columna Derecha: Contenido del artículo */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="h-3.5 w-3.5 text-accent-600" />
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                Cuerpo del Comunicado
              </h4>
            </div>

            <div className="flex-1 flex flex-col">
              <FormLabel htmlFor="cuerpo_html">
                Contenido <span className="normal-case text-slate-400 font-normal ml-1">(HTML permitido) *</span>
              </FormLabel>
              <textarea
                id="cuerpo_html"
                required 
                maxLength={50000}
                value={form.cuerpo_html}
                onChange={e => handleChange('cuerpo_html', e.target.value)}
                placeholder="<p>Redacte aquí los párrafos y detalles de la noticia...</p>"
                className={`${inputCls} font-mono resize-y flex-1 min-h-[200px]`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Pie Fijo Inferior con Botones estilo DonationModal ── */}
      <div className="p-4 sm:p-6 bg-white border-t border-slate-200 shrink-0 flex items-center justify-end gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={submitting} 
          className="btn-accent py-3.5 px-7 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Publicar Noticia')}
        </button>
      </div>
    </form>
  );
};

export default NewsForm;
