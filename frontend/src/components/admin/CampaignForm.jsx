import React, { useState } from 'react';
import { X, Sparkles, Info, Save, Pencil, Target } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0 flex-1">
      {/* ── Cabecera Fija Superior ── */}
      <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-100 bg-white sticky top-0 z-20 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-brand-50 border border-brand-100/80 flex items-center justify-center text-brand-600 shrink-0">
            {isEditing ? <Pencil className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-display font-black text-slate-800">
                {isEditing ? '✏️ Editar Campaña' : '+ Nueva Campaña Híbrida'}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md hidden sm:inline-block">
                {isEditing ? 'Edición' : 'Iniciativa'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing
                ? `Actualice los datos de "${campaign?.titulo || 'campaña'}"`
                : 'Complete los datos requeridos para publicar en el portal.'}
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
        {/* Card 1: Datos Generales */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Datos Generales de la Campaña
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="md:col-span-2">
              <FormLabel htmlFor="titulo">Título de la Campaña *</FormLabel>
              <input 
                id="titulo"
                type="text" 
                required 
                maxLength={255}
                value={form.titulo} 
                onChange={e => handleChange('titulo', e.target.value)} 
                className={inputCls} 
                placeholder="Ej: Equipamiento de Terapia Intensiva" 
              />
            </div>

            <div>
              <FormLabel htmlFor="monto_objetivo">Monto Objetivo (ARS) *</FormLabel>
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

        {/* Card 2: Multimedia y Equipamiento */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Multimedia y Equipo Médico
            </h4>
          </div>

          <div className="space-y-5">
            <div>
              <FileUpload
                tipo="imagen"
                value={form.imagenUrl}
                onChange={val => handleChange('imagenUrl', val)}
                label="Imagen de la Campaña (Galería)"
              />
            </div>
            
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 text-brand-600" />
                <FormLabel htmlFor="equipamiento_info">Información / Utilidad del Equipo</FormLabel>
              </div>
              <textarea
                id="equipamiento_info"
                maxLength={2000}
                rows={4}
                value={form.equipamiento_info}
                onChange={e => handleChange('equipamiento_info', e.target.value)}
                className={`${inputCls} resize-y min-h-[100px]`}
                placeholder="Ej: Este equipamiento de última generación permitirá atender a pacientes de neonatología..."
              />
            </div>
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
            className="btn-brand w-full sm:w-auto px-6 py-2.5 shine disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Campaña')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CampaignForm;
