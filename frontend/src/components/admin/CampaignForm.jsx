import React, { useState } from 'react';
import { X, Sparkles, Save, Info } from 'lucide-react';
import FileUpload from '../FileUpload';

const FormLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
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
      {/* ── Header idéntico al estilo DonationModal ── */}
      <div className="bg-slate-50 border-b border-slate-200 p-5 sm:p-6 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">
              {isEditing ? 'Editar Campaña' : 'Nueva Campaña'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {isEditing 
                ? (campaign?.titulo || 'Actualice la información de la iniciativa') 
                : 'Complete la información requerida para publicar en el portal'}
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

      {/* ── Cuerpo con Scroll Fluido (Diseño 2 columnas estilo modal) ── */}
      <div 
        className="p-5 sm:p-6 md:p-8 overflow-y-auto overscroll-contain flex-1 min-h-0 bg-slate-50/30"
        data-lenis-prevent
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda: Información Principal */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="h-2 w-2 rounded-full bg-brand-600" />
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                Información Principal
              </h4>
            </div>

            <div>
              <FormLabel htmlFor="titulo">Título de la Campaña *</FormLabel>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <FormLabel htmlFor="monto_actual">Monto Recaudado (ARS)</FormLabel>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Columna Derecha: Multimedia y Equipamiento */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                Multimedia y Equipamiento
              </h4>
            </div>

            <div>
              <FileUpload
                tipo="imagen"
                value={form.imagenUrl}
                onChange={val => handleChange('imagenUrl', val)}
                label="Imagen de la Campaña"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info className="h-3.5 w-3.5 text-brand-600" />
                <FormLabel htmlFor="equipamiento_info">Información del Equipo Médico</FormLabel>
              </div>
              <textarea
                id="equipamiento_info"
                maxLength={2000}
                rows={4}
                value={form.equipamiento_info}
                onChange={e => handleChange('equipamiento_info', e.target.value)}
                className={`${inputCls} resize-y min-h-[90px]`}
                placeholder="Ej: Este respirador de alta frecuencia servirá para la sala de neonatología..."
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
          className="btn-brand py-3.5 px-7 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Campaña')}
        </button>
      </div>
    </form>
  );
};

export default CampaignForm;
