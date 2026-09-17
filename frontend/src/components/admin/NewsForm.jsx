import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-accent-600 bg-accent-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
            {isEditing ? 'Modo Edición' : 'Novedad'}
          </span>
          <h3 className="text-lg sm:text-xl font-display font-black text-slate-800">
            {isEditing ? '✏️ Editar Noticia' : '+ Nueva Noticia'}
          </h3>
        </div>
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={submitting}
          aria-label="Cerrar"
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <FormLabel htmlFor="titulo">Título</FormLabel>
        <input 
          id="titulo"
          type="text" 
          required 
          maxLength={255}
          value={form.titulo} 
          onChange={e => handleChange('titulo', e.target.value)} 
          className={inputCls} 
          placeholder="Ej: Nuevo equipamiento para maternidad" 
        />
      </div>
      <div>
        <FormLabel htmlFor="cuerpo_html">Cuerpo / Contenido <span className="normal-case text-slate-400 font-normal ml-1">(HTML permitido)</span></FormLabel>
        <textarea
          id="cuerpo_html"
          required 
          maxLength={50000}
          rows={5} 
          value={form.cuerpo_html}
          onChange={e => handleChange('cuerpo_html', e.target.value)}
          placeholder="<p>Texto de la noticia...</p>"
          className={`${inputCls} font-mono resize-y`}
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

      <FileUpload
        tipo="imagen"
        value={form.imagen_url}
        onChange={val => handleChange('imagen_url', val)}
        label="Imagen de portada (opcional)"
      />

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={submitting} 
          className="btn-accent w-full sm:w-auto px-6 py-3 shine disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
        >
          <Save className="h-4 w-4" />
          {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Publicar Noticia')}
        </button>
      </div>
    </form>
  );
};

export default NewsForm;
