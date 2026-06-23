import React, { useState } from 'react';
import { X, Sparkles, Info, Save } from 'lucide-react';
import FileUpload from '../FileUpload';

const FormLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
    {children}
  </label>
);

const inputCls = "input-field";

const CampaignForm = ({ campaign, onSave, onCancel }) => {
  const isEditing = !!campaign;
  
  const [form, setForm] = useState({
    titulo: campaign?.titulo || '',
    monto_objetivo: campaign?.monto_objetivo || '',
    monto_actual: campaign?.monto_actual || '',
    fecha_limite: campaign?.fecha_limite ? campaign.fecha_limite.split('T')[0] : '',
    testimoniosText: campaign?.detalles?.testimonios?.[0]?.texto || '',
    testimoniosAutor: campaign?.detalles?.testimonios?.[0]?.autor || '',
    imagenUrl: campaign?.detalles?.galeria_rica?.imagenes?.[0] || '',
    obraStatus: campaign?.detalles?.obra_status || 'Planeada',
    es_campana_del_mes: campaign?.es_campana_del_mes || false,
    equipamiento_info: campaign?.detalles?.equipamiento_info || '',
    equipamiento_imagen: campaign?.detalles?.equipamiento_imagen || '',
  });

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedForm = {
      titulo: (form.titulo || '').trim(),
      monto_objetivo: parseFloat(form.monto_objetivo) || 0,
      monto_actual: form.monto_actual !== '' ? (parseFloat(form.monto_actual) || 0) : 0,
      fecha_limite: form.fecha_limite ? form.fecha_limite : null,
      testimoniosText: (form.testimoniosText || '').trim(),
      testimoniosAutor: (form.testimoniosAutor || '').trim(),
      imagenUrl: (form.imagenUrl || '').trim(),
      obraStatus: (form.obraStatus || 'Planeada').trim(),
      es_campana_del_mes: form.es_campana_del_mes,
      equipamiento_info: (form.equipamiento_info || '').trim(),
      equipamiento_imagen: (form.equipamiento_imagen || '').trim()
    };
    onSave(cleanedForm);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-lg font-display font-black text-slate-800">
          {isEditing ? '✏️ Editar Campaña' : '+ Nueva Campaña Híbrida'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar"
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* SQL fields */}
      <div>
        <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-brand-400 rounded-full" />
          Datos Generales
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormLabel htmlFor="titulo">Título de la Campaña</FormLabel>
            <input 
              id="titulo"
              type="text" 
              required 
              value={form.titulo} 
              onChange={e => handleChange('titulo', e.target.value)} 
              className={inputCls} 
              placeholder="Ej: Equipamiento para Pediatría" 
            />
          </div>
          <div>
            <FormLabel htmlFor="monto_objetivo">Monto Objetivo (ARS)</FormLabel>
            <input 
              id="monto_objetivo"
              type="number" 
              required 
              min="0" 
              value={form.monto_objetivo} 
              onChange={e => handleChange('monto_objetivo', e.target.value)} 
              className={inputCls} 
              placeholder="5000000" 
            />
          </div>
          <div>
            <FormLabel htmlFor="monto_actual">Monto Actual Recaudado (ARS)</FormLabel>
            <input 
              id="monto_actual"
              type="number" 
              min="0" 
              value={form.monto_actual} 
              onChange={e => handleChange('monto_actual', e.target.value)} 
              className={inputCls} 
              placeholder="0" 
            />
          </div>
          <div>
            <FormLabel htmlFor="fecha_limite">Fecha Límite</FormLabel>
            <input 
              id="fecha_limite"
              type="date" 
              value={form.fecha_limite} 
              onChange={e => handleChange('fecha_limite', e.target.value)} 
              className={inputCls} 
            />
          </div>
          <div>
            <FormLabel htmlFor="obraStatus">Estado de Obra</FormLabel>
            <select 
              id="obraStatus"
              value={form.obraStatus} 
              onChange={e => handleChange('obraStatus', e.target.value)} 
              className={inputCls}
            >
              <option value="Planeada">Planeada</option>
              <option value="En Ejecución">En Ejecución</option>
              <option value="En Proceso de Licitación">En Proceso de Licitación</option>
              <option value="Finalizada">Finalizada</option>
              <option value="Suspendida">Suspendida</option>
            </select>
          </div>

        </div>
      </div>

      {/* NoSQL fields */}
      <div className="bg-violet-50 border border-violet-200/50 rounded-2xl p-5 space-y-4">
        <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Detalles Multimedia
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="testimoniosText">Testimonio (Texto)</FormLabel>
            <input 
              id="testimoniosText"
              type="text" 
              value={form.testimoniosText} 
              onChange={e => handleChange('testimoniosText', e.target.value)} 
              className={inputCls} 
              placeholder="Fue un gran aporte para el hospital..." 
            />
          </div>
          <div>
            <FormLabel htmlFor="testimoniosAutor">Testimonio (Autor)</FormLabel>
            <input 
              id="testimoniosAutor"
              type="text" 
              value={form.testimoniosAutor} 
              onChange={e => handleChange('testimoniosAutor', e.target.value)} 
              className={inputCls} 
              placeholder="Dr. Juan Gómez" 
            />
          </div>
          <div className="md:col-span-2">
            <FileUpload
              tipo="imagen"
              value={form.imagenUrl}
              onChange={val => handleChange('imagenUrl', val)}
              label="Imagen de la Campaña (Galería)"
            />
          </div>
          
          {/* Equipamiento fields */}
          <div className="md:col-span-2 border-t border-violet-200/50 pt-4 mt-2">
            <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Info className="h-3.5 w-3.5 text-violet-600" />
              Información del Equipo Médico
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormLabel htmlFor="equipamiento_info">Información / Utilidad del Equipo</FormLabel>
                <textarea
                  id="equipamiento_info"
                  value={form.equipamiento_info}
                  onChange={e => handleChange('equipamiento_info', e.target.value)}
                  className={`${inputCls} min-h-[100px] py-3`}
                  placeholder="Ej: Este respirador de alta frecuencia servirá para la sala de neonatología..."
                />
              </div>
              <div className="md:col-span-2">
                <FileUpload
                  tipo="imagen"
                  value={form.equipamiento_imagen}
                  onChange={val => handleChange('equipamiento_imagen', val)}
                  label="Imagen del aparato a adquirir"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button type="submit" className="btn-brand w-full py-3.5 shine">
        <Save className="h-4 w-4" />
        {isEditing ? 'Guardar Cambios' : 'Crear Campaña'}
      </button>
    </form>
  );
};

export default CampaignForm;
