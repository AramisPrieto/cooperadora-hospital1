import React, { useState } from 'react';
import { X, Sparkles, Info, Save } from 'lucide-react';
import FileUpload from '../FileUpload';

const FormLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
    {children}
  </label>
);

const inputCls = "input-field";

const CampaignForm = ({ campaign, onSave, onCancel, submitting }) => {
  const isEditing = !!campaign;
  
  const [form, setForm] = useState({
    titulo: campaign?.titulo || '',
    monto_objetivo: campaign?.monto_objetivo || '',
    monto_actual: campaign?.monto_actual || '',
    fecha_limite: campaign?.fecha_limite ? campaign.fecha_limite.split('T')[0] : '',
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
      imagenUrl: (form.imagenUrl || '').trim(),
      obraStatus: (form.obraStatus || 'Planeada').trim(),
      es_campana_del_mes: form.es_campana_del_mes,
      equipamiento_info: (form.equipamiento_info || '').trim(),
      equipamiento_imagen: (form.equipamiento_imagen || '').trim()
    };
    onSave(cleanedForm);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
            {isEditing ? 'Modo Edición' : 'Iniciativa'}
          </span>
          <h3 className="text-lg sm:text-xl font-display font-black text-slate-800">
            {isEditing ? '✏️ Editar Campaña' : '+ Nueva Campaña Híbrida'}
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
              maxLength={255}
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
              min="1000"
              max="1000000000"
              step="any"
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
              max="1000000000"
              step="any"
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
                  maxLength={2000}
                  value={form.equipamiento_info}
                  onChange={e => handleChange('equipamiento_info', e.target.value)}
                  className={`${inputCls} min-h-[100px] py-3`}
                  placeholder="Ej: Este respirador de alta frecuencia servirá para la sala de neonatología..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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
          className="btn-brand w-full sm:w-auto px-6 py-3 shine disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
        >
          <Save className="h-4 w-4" />
          {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Campaña')}
        </button>
      </div>
    </form>
  );
};

export default CampaignForm;
