import React, { useState, useEffect } from 'react';
import { User, FileText, CheckCircle, Calendar, Phone, MapPin, CreditCard, ShieldAlert, Save } from 'lucide-react';

const SocioProfile = ({ profile, onUpdate, submitting }) => {
  const [form, setForm] = useState({
    dni: profile?.dni ? profile.dni.toString() : '',
    telefono: profile?.telefono || '',
    direccion: profile?.direccion || '',
    localidad: profile?.localidad || ''
  });

  // Keep state in sync if profile changes
  useEffect(() => {
    if (profile) {
      setForm({
        dni: profile.dni ? profile.dni.toString() : '',
        telefono: profile.telefono || '',
        direccion: profile.direccion || '',
        localidad: profile.localidad || ''
      });
    }
  }, [profile]);

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      dni: parseInt(form.dni),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      localidad: form.localidad.trim()
    });
  };

  const isUnchanged = 
    form.dni === (profile?.dni ? profile.dni.toString() : '') &&
    form.telefono === (profile?.telefono || '') &&
    form.direccion === (profile?.direccion || '') &&
    form.localidad === (profile?.localidad || '');

  return (
    <div className="grid md:grid-cols-3 gap-6 animate-fade-up">
      {/* Card de Información del Socio */}
      <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="h-5 w-5 text-brand-600" />
          Datos de la Asociación
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Número de Asociado */}
          <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Nº Asociado</p>
              <p className="text-slate-800 font-black mt-1 text-sm">#{String(profile.numero_asociado).padStart(4, '0')}</p>
            </div>
          </div>

          {/* Estado de Aprobación */}
          <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-slate-100/60 border border-slate-200/60 text-slate-500 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Estado de Registro</p>
              <div className="mt-1">
                {profile.estado === 'activo' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Activo
                  </span>
                ) : profile.estado === 'pendiente' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                    Pendiente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Nombre y Apellido */}
          <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-slate-100/60 border border-slate-200/60 text-slate-500 flex items-center justify-center shrink-0">
              <User className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Nombre y Apellido</p>
              <p className="text-slate-800 font-bold mt-1">{profile.nombre} {profile.apellido}</p>
            </div>
          </div>

          {/* DNI */}
          <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-slate-100/60 border border-slate-200/60 text-slate-500 flex items-center justify-center shrink-0">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">DNI / Documento</p>
              <p className="text-slate-800 font-semibold mt-1">{profile.dni}</p>
            </div>
          </div>

          {/* Fecha de Alta */}
          <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-slate-100/60 border border-slate-200/60 text-slate-500 flex items-center justify-center shrink-0">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Fecha de Alta</p>
              <p className="text-slate-800 font-semibold mt-1">
                {profile?.fecha_alta
                  ? new Date(profile.fecha_alta).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'
                }
              </p>
            </div>
          </div>

          {/* Teléfono */}
          <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-slate-100/60 border border-slate-200/60 text-slate-500 flex items-center justify-center shrink-0">
              <Phone className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Teléfono de Contacto</p>
              <p className="text-slate-800 font-semibold mt-1">{profile.telefono || '—'}</p>
            </div>
          </div>

          {/* Dirección */}
          <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 shadow-sm sm:col-span-2">
            <div className="h-9 w-9 rounded-xl bg-slate-100/60 border border-slate-200/60 text-slate-500 flex items-center justify-center shrink-0">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Domicilio de Cobro / Contacto</p>
              <p className="text-slate-800 font-semibold mt-1">{profile.direccion}, {profile.localidad}</p>
            </div>
          </div>

          {/* Método de Pago */}
          <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-slate-100/60 border border-slate-200/60 text-slate-500 flex items-center justify-center shrink-0">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Medio de Pago Preferido</p>
              <p className="text-slate-800 font-black mt-1 uppercase text-[10px] tracking-wider">{profile.metodo_pago === 'debito' ? 'Débito MP' : profile.metodo_pago}</p>
            </div>
          </div>

          {/* Nacionalidad */}
          <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/80 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-slate-100/60 border border-slate-200/60 text-slate-500 flex items-center justify-center shrink-0">
              <User className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">Nacionalidad</p>
              <p className="text-slate-800 font-semibold mt-1">{profile.nacionalidad}</p>
            </div>
          </div>
        </div>

        {profile.estado === 'pendiente' && (
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200/50 rounded-2xl text-xs text-amber-800 font-medium">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Tu registro se encuentra en proceso de validación.</p>
              <p className="mt-0.5 text-amber-700">La comisión directiva de la cooperadora debe contrastar tu información antes de activarte completamente en el Libro Oficial.</p>
            </div>
          </div>
        )}
      </div>

      {/* Formulario de Modificación de Datos (DNI, Teléfono, Dirección, Localidad) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Save className="h-5 w-5 text-brand-600" />
          Actualizar Datos
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              DNI
            </label>
            <input
              type="number"
              required
              value={form.dni}
              onChange={e => handleChange('dni', e.target.value)}
              className="input-field"
              placeholder="DNI del socio"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Teléfono
            </label>
            <input
              type="text"
              required
              value={form.telefono}
              onChange={e => handleChange('telefono', e.target.value)}
              className="input-field"
              placeholder="Teléfono de contacto"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Dirección
            </label>
            <input
              type="text"
              required
              value={form.direccion}
              onChange={e => handleChange('direccion', e.target.value)}
              className="input-field"
              placeholder="Domicilio"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Localidad
            </label>
            <input
              type="text"
              required
              value={form.localidad}
              onChange={e => handleChange('localidad', e.target.value)}
              className="input-field"
              placeholder="Localidad"
            />
          </div>

          <p className="text-[10px] text-slate-400 leading-normal">
            Podés corregir tu DNI, cambiar tu teléfono o tu domicilio de contacto. Para otras modificaciones, contactate con la administración.
          </p>

          <button
            type="submit"
            disabled={submitting || isUnchanged}
            className="btn-brand w-full py-3 text-xs uppercase tracking-wider shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'Actualizar Información'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SocioProfile;
