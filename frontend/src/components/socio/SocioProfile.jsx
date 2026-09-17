import React, { useState, useEffect } from 'react';
import { User, FileText, CheckCircle, Calendar, Phone, MapPin, CreditCard, ShieldAlert, Save, X, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const SocioProfile = ({ profile, onUpdate, submitting }) => {
  const [showBajaModal, setShowBajaModal] = useState(false);
  const [bajaPassword, setBajaPassword] = useState('');
  const [bajaMotivo, setBajaMotivo] = useState('');
  const [bajaSubmitting, setBajaSubmitting] = useState(false);
  const [bajaError, setBajaError] = useState('');
  const [form, setForm] = useState({
    telefono: profile?.telefono || '',
    direccion: profile?.direccion || '',
    localidad: profile?.localidad || ''
  });

  // Keep state in sync if profile changes
  useEffect(() => {
    if (profile) {
      setForm({
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
      telefono: (form.telefono || '').trim(),
      direccion: (form.direccion || '').trim(),
      localidad: (form.localidad || '').trim()
    });
  };

  const handleConfirmBaja = async (e) => {
    e.preventDefault();
    if (!bajaPassword) {
      setBajaError('Debes ingresar tu contraseña para confirmar la baja.');
      return;
    }
    setBajaSubmitting(true);
    setBajaError('');
    try {
      await api.delete('/socios/mi-cuenta', {
        data: { password: bajaPassword, motivo: bajaMotivo }
      });
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login?baja=true';
    } catch (err) {
      setBajaError(err.response?.data?.error || 'Error al procesar la baja de membresía.');
      setBajaSubmitting(false);
    }
  };

  const isUnchanged = 
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

      {/* Formulario de Modificación de Datos de Contacto (Teléfono, Dirección, Localidad) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Save className="h-5 w-5 text-brand-600" />
          Actualizar Datos de Contacto
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Teléfono
            </label>
            <input
              type="tel"
              required
              minLength={7}
              maxLength={25}
              pattern="^[+]?[\d\s\-()]{7,25}$"
              title="Ingrese un teléfono válido (entre 7 y 15 dígitos numéricos)"
              value={form.telefono}
              onChange={e => handleChange('telefono', e.target.value)}
              className="input-field"
              placeholder="Ej: 2262550000"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Dirección
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={255}
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
              minLength={2}
              maxLength={100}
              pattern="^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s'.-]{2,100}$"
              value={form.localidad}
              onChange={e => handleChange('localidad', e.target.value)}
              className="input-field"
              placeholder="Localidad"
            />
          </div>

          <p className="text-[10px] text-slate-400 leading-normal">
            Podés modificar tu teléfono o tu domicilio de contacto. Para rectificaciones de DNI o datos personales registrados, contactate con la secretaría de la Cooperadora.
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

      {/* ── Zona de Peligro: Baja de Membresía ── */}
      <div className="md:col-span-3 bg-rose-50/60 border border-rose-200/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            Baja de Membresía y Cuenta
          </h3>
          <p className="text-xs text-rose-700/80 mt-1 max-w-xl">
            Podés dar de baja tu membresía como socio en cualquier momento. Si tenés una suscripción activa por débito automático en Mercado Pago, se cancelará inmediatamente. Tus aportes y donaciones históricas quedarán preservados en la contabilidad del hospital.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setBajaError('');
            setBajaPassword('');
            setBajaMotivo('');
            setShowBajaModal(true);
          }}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm shrink-0"
        >
          Solicitar baja de membresía
        </button>
      </div>

      {/* ── Modal de Confirmación de Baja ── */}
      {showBajaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-900">Confirmar Baja de Membresía</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBajaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Por favor confirmá tu contraseña para procesar la baja. Tu condición de socio pasará a <span className="font-bold text-rose-600">inactivo</span> y tu débito recurrente será cancelado.
            </p>

            {bajaError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{bajaError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmBaja} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  value={bajaPassword}
                  onChange={e => setBajaPassword(e.target.value)}
                  className="input-field"
                  placeholder="Ingresá tu contraseña"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Motivo de la baja (opcional)
                </label>
                <textarea
                  rows="2"
                  maxLength="200"
                  value={bajaMotivo}
                  onChange={e => setBajaMotivo(e.target.value)}
                  className="input-field resize-none text-xs"
                  placeholder="Contanos brevemente el motivo..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBajaModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={bajaSubmitting}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {bajaSubmitting ? 'Procesando baja...' : 'Confirmar Baja Definitiva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocioProfile;
