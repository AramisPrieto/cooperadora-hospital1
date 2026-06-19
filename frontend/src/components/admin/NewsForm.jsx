import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import FileUpload from '../FileUpload';

const FormLabel = ({ children }) => (
  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
    {children}
  </label>
);

const inputCls = "input-field";

const NewsForm = ({ news, onSave, onCancel }) => {
  const isEditing = !!news;

  const [form, setForm] = useState({
    titulo: news?.titulo || '',
    cuerpo_html: news?.cuerpo_html || '',
    fecha: news?.fecha ? news.fecha.split('T')[0] : '',
    imagen_url: news?.imagen_url || ''
  });

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-lg font-display font-black text-slate-800">
          {isEditing ? '✏️ Editar Noticia' : '+ Nueva Noticia'}
        </h3>
        <button 
          type="button" 
          onClick={onCancel} 
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <FormLabel>Título</FormLabel>
        <input 
          type="text" 
          required 
          value={form.titulo} 
          onChange={e => handleChange('titulo', e.target.value)} 
          className={inputCls} 
          placeholder="Ej: Nuevo equipamiento para maternidad" 
        />
      </div>
      <div>
        <FormLabel>Cuerpo / Contenido <span className="normal-case text-slate-400 font-normal ml-1">(HTML permitido)</span></FormLabel>
        <textarea
          required 
          rows={5} 
          value={form.cuerpo_html}
          onChange={e => handleChange('cuerpo_html', e.target.value)}
          placeholder="<p>Texto de la noticia...</p>"
          className={`${inputCls} font-mono resize-y`}
        />
      </div>
      <div>
        <FormLabel>Fecha de Publicación</FormLabel>
        <input 
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

      <button type="submit" className="btn-brand w-full py-3.5 shine">
        <Save className="h-4 w-4" />
        {isEditing ? 'Guardar Cambios' : 'Publicar Noticia'}
      </button>
    </form>
  );
};

export default NewsForm;
