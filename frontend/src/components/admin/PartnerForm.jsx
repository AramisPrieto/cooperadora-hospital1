import React, { useState } from 'react';
import { User, MapPin, Shield } from 'lucide-react';

const PartnerForm = ({ partner, onSave, onCancel, submitting }) => {
  const [form, setForm] = useState({
    nombre: partner.nombre || '',
    apellido: partner.apellido || '',
    direccion: partner.direccion || '',
    localidad: partner.localidad || '',
    nacionalidad: partner.nacionalidad || '',
    telefono: partner.telefono || '',
    fecha_nacimiento: partner.fecha_nacimiento || '',
    genero: partner.genero || '',
    metodo_pago: partner.metodo_pago || '',
    fecha_ultimo_pago: partner.fecha_ultimo_pago || '',
    observaciones: partner.observaciones || ''
  });

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedForm = {
      nombre: (form.nombre || '').trim(),
      apellido: (form.apellido || '').trim(),
      direccion: (form.direccion || '').trim(),
      localidad: (form.localidad || '').trim(),
      nacionalidad: (form.nacionalidad || '').trim(),
      telefono: (form.telefono || '').trim(),
      fecha_nacimiento: form.fecha_nacimiento ? form.fecha_nacimiento : null,
      genero: (form.genero || '').trim(),
      metodo_pago: (form.metodo_pago || '').trim(),
      fecha_ultimo_pago: form.fecha_ultimo_pago ? form.fecha_ultimo_pago : null,
      observaciones: (form.observaciones || '').trim()
    };
    onSave(partner.numero_asociado, cleanedForm);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-down w-full text-xs">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Col 1: Datos Personales */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-brand-500" />
            Editar Datos Personales
          </h4>
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <label htmlFor="nombre" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre *</label>
              <input 
                id="nombre"
                type="text" 
                value={form.nombre} 
                onChange={e => handleChange('nombre', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs" 
                required
              />
            </div>
            <div>
              <label htmlFor="apellido" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Apellido *</label>
              <input 
                id="apellido"
                type="text" 
                value={form.apellido} 
                onChange={e => handleChange('apellido', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs" 
                required
              />
            </div>
            <div>
              <label htmlFor="fecha_nacimiento" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Nacimiento *</label>
              <input 
                id="fecha_nacimiento"
                type="date" 
                value={form.fecha_nacimiento} 
                onChange={e => handleChange('fecha_nacimiento', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs" 
                required
              />
            </div>
            <div>
              <label htmlFor="genero" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Género *</label>
              <select 
                id="genero"
                value={form.genero} 
                onChange={e => handleChange('genero', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs"
                required
              >
                <option value="">Seleccione...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="nacionalidad" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nacionalidad *</label>
              <select 
                id="nacionalidad"
                value={form.nacionalidad} 
                onChange={e => handleChange('nacionalidad', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs" 
                required
              >
                <option value="">Seleccione...</option>
                <option value="Argentina">Argentina</option>
                <option value="Extranjera">Extranjera</option>
              </select>
            </div>
          </div>
        </div>

        {/* Col 2: Contacto y Ubicación */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            Editar Contacto y Ubicación
          </h4>
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <label htmlFor="telefono" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono *</label>
              <input 
                id="telefono"
                type="text" 
                value={form.telefono} 
                onChange={e => handleChange('telefono', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs" 
                required
              />
            </div>
            <div>
              <label htmlFor="direccion" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dirección *</label>
              <input 
                id="direccion"
                type="text" 
                value={form.direccion} 
                onChange={e => handleChange('direccion', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs" 
                required
              />
            </div>
            <div>
              <label htmlFor="localidad" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Localidad *</label>
              <select 
                id="localidad"
                value={form.localidad} 
                onChange={e => handleChange('localidad', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs" 
                required
              >
                <option value="">Seleccione...</option>
                <option value="Necochea">Necochea</option>
                <option value="Quequén">Quequén</option>
                <option value="La Dulce">La Dulce</option>
                <option value="Juan N. Fernández">Juan N. Fernández</option>
                <option value="Claraz">Claraz</option>
                <option value="Ramón Santamarina">Ramón Santamarina</option>
                <option value="Otra">Otra</option>
              </select>
            </div>
          </div>
        </div>

        {/* Col 3: Administración */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-brand-500" />
            Editar Administración
          </h4>
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <label htmlFor="metodo_pago" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Método de Pago *</label>
              <select 
                id="metodo_pago"
                value={form.metodo_pago} 
                onChange={e => handleChange('metodo_pago', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs"
                required
              >
                <option value="">Seleccione...</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="efectivo">Efectivo</option>
                <option value="cobrador">Cobrador a Domicilio</option>
                <option value="debito">Débito Automático</option>
              </select>
            </div>
            <div>
              <label htmlFor="fecha_ultimo_pago" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Último Pago</label>
              <input 
                id="fecha_ultimo_pago"
                type="date" 
                value={form.fecha_ultimo_pago} 
                onChange={e => handleChange('fecha_ultimo_pago', e.target.value)} 
                className="input-field py-1.5 px-3 text-xs" 
              />
            </div>
            <div>
              <label htmlFor="observaciones" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Observaciones</label>
              <textarea 
                id="observaciones"
                value={form.observaciones} 
                onChange={e => handleChange('observaciones', e.target.value)} 
                rows={3} 
                className="input-field py-1.5 px-3 text-xs resize-none" 
                placeholder="Notas internas..." 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase tracking-wider rounded-xl text-[10px] transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold uppercase tracking-wider rounded-xl text-[10px] transition-colors disabled:opacity-40 flex items-center gap-1.5"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};

export default PartnerForm;
