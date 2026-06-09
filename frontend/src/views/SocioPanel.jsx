import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  User, Heart, CheckCircle, Clock, XCircle,
  CreditCard, Banknote, Calendar, ShieldAlert,
  Save, AlertCircle, RefreshCw, ChevronRight
} from 'lucide-react';

/* ── Tarjeta de estadística pequeña en cabecera ── */
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div>
      <p className="text-xl font-display font-black text-slate-800 leading-none">{value}</p>
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);

const TABS = [
  { id: 'resumen', label: 'Mi Resumen', icon: User },
  { id: 'cuotas', label: 'Mis Cuotas', icon: CreditCard },
  { id: 'donaciones', label: 'Mis Donaciones', icon: Banknote },
];

const SocioPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resumen');
  
  // Datos del socio
  const [profile, setProfile] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [donaciones, setDonaciones] = useState([]);
  
  // Formularios y estados
  const [dniInput, setDniInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
    }
  }, [token, user, navigate]);

  const loadSocioData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Obtener perfil
      const profileRes = await api.get('/socios/mi-perfil');
      setProfile(profileRes.data);
      setDniInput(profileRes.data.dni.toString());

      // 2. Obtener cuotas
      const cuotasRes = await api.get('/socios/mi-perfil/cuotas');
      setCuotas(cuotasRes.data.cuotas || []);

      // 3. Obtener donaciones
      const donacionesRes = await api.get('/donaciones/mis-donaciones');
      setDonaciones(donacionesRes.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setErrorMsg('Tu cuenta de usuario aún no tiene un perfil de socio asociado en el Libro de Registro.');
      } else {
        setErrorMsg('Error al cargar la información del panel de socio.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadSocioData();
    }
  }, [token]);

  // Limpiar mensaje de éxito después de unos segundos
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // Actualizar DNI
  const handleUpdateDni = async (e) => {
    e.preventDefault();
    if (!profile) return;
    
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.put(`/socios/${profile.numero_asociado}`, {
        dni: parseInt(dniInput)
      });
      setSuccessMsg('DNI actualizado correctamente.');
      setProfile(res.data.socio);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al actualizar el DNI.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular métricas rápidas
  const totalDonado = donaciones
    .filter(d => d.estado === 'aprobada')
    .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

  const cuotasPagas = cuotas.filter(c => c.estado === 'pagado').length;
  const cuotasPendientes = cuotas.filter(c => c.estado === 'pendiente').length;

  return (
    <div className="flex-grow bg-slate-50 min-h-screen">
      {/* ── Cabecera del Panel ── */}
      <div className="bg-white border-b border-slate-200 pt-28">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-black text-slate-900">Panel de Socio</h1>
                <p className="text-slate-500 text-xs font-medium mt-0.5">
                  Autogestión de asociados — Socio: <span className="text-brand-600 font-bold">{user?.email}</span>
                </p>
              </div>
            </div>
            
            {profile && (
              <div className="flex flex-wrap gap-4">
                <StatCard label="Total Aportado" value={`$${totalDonado.toLocaleString('es-AR')}`} icon={Heart} color="bg-brand-600" />
                <StatCard label="Cuotas Pagas" value={cuotasPagas} icon={CreditCard} color="bg-accent-600" />
                <StatCard label="Donaciones" value={donaciones.length} icon={Banknote} color="bg-slate-600" />
              </div>
            )}
          </div>

          {/* Selector de Pestañas */}
          <div className="flex gap-1 border-t border-slate-100 pt-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Contenido Principal ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        
        {/* Alertas Globales */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl animate-fade-up">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="flex-grow">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-600">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-2xl animate-fade-up">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ══════════════ TAB: RESUMEN / MI PERFIL ══════════════ */}
            {activeTab === 'resumen' && profile && (
              <div className="grid md:grid-cols-3 gap-6 animate-fade-up">
                
                {/* Card de Información del Socio */}
                <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
                  <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="h-5 w-5 text-brand-600" />
                    Datos de la Asociación
                  </h2>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Número de Asociado</p>
                      <p className="text-2xl font-display font-black text-slate-800 mt-1">#{profile.numero_asociado}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado de Aprobación</p>
                      <div className="mt-1">
                        {profile.estado === 'activo' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-black uppercase tracking-wider">
                            <CheckCircle className="h-3 w-3" /> Activo
                          </span>
                        ) : profile.estado === 'pendiente' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-black uppercase tracking-wider">
                            <Clock className="h-3 w-3 animate-pulse" /> Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-black uppercase tracking-wider">
                            <XCircle className="h-3 w-3" /> Inactivo
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha de Alta</p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">
                        {new Date(profile.fecha_alta).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DNI Registrado</p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{profile.dni}</p>
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

                {/* Formulario de Modificación de DNI */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
                  <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Save className="h-5 w-5 text-brand-600" />
                    Actualizar Datos
                  </h2>

                  <form onSubmit={handleUpdateDni} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Modificar DNI
                      </label>
                      <input
                        type="number"
                        required
                        value={dniInput}
                        onChange={e => setDniInput(e.target.value)}
                        className="input-field"
                        placeholder="DNI del socio"
                      />
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Solo podés actualizar tu DNI en caso de error. Para otros cambios de datos, contactate con administración.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || dniInput === profile.dni.toString()}
                      className="btn-brand w-full py-3 text-xs uppercase tracking-wider shadow-sm disabled:opacity-50"
                    >
                      {submitting ? 'Guardando...' : 'Actualizar DNI'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ══════════════ TAB: CUOTAS SOCIALES ══════════════ */}
            {activeTab === 'cuotas' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fade-up">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-brand-600" />
                      Historial de Cuotas Sociales
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Visualizá el estado de tus aportaciones de membresía mensual.</p>
                  </div>
                  <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl">Pendientes: {cuotasPendientes}</span>
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">Pagas: {cuotasPagas}</span>
                  </div>
                </div>

                {cuotas.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-semibold">No se encontraron registros de cuotas emitidas.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="p-4">Período</th>
                          <th className="p-4 text-right">Monto</th>
                          <th className="p-4">Fecha Pago</th>
                          <th className="p-4">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cuotas.map(cuota => {
                          const fechaObj = new Date(2026, cuota.mes - 1, 1);
                          const periodoStr = fechaObj.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                          return (
                            <tr key={cuota.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-bold text-slate-700 capitalize">{periodoStr}</td>
                              <td className="p-4 text-right font-black text-slate-800">
                                ${parseFloat(cuota.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-4 text-slate-400 font-medium">
                                {cuota.fecha_pago
                                  ? new Date(cuota.fecha_pago).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : '—'
                                }
                              </td>
                              <td className="p-4">
                                {cuota.estado === 'pagado' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    <CheckCircle className="h-3 w-3" /> Pagada
                                  </span>
                                ) : cuota.estado === 'pendiente' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    <Clock className="h-3 w-3" /> Pendiente
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    <XCircle className="h-3 w-3" /> Vencida
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════ TAB: DONACIONES DECLARADAS ══════════════ */}
            {activeTab === 'donaciones' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fade-up">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-brand-600" />
                    Mis Donaciones por Transferencia
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Estado de tus declaraciones de transferencias realizadas a nuestras campañas.</p>
                </div>

                {donaciones.length === 0 ? (
                  <div className="text-center py-12">
                    <Banknote className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-semibold">Aún no declaraste ninguna donación.</p>
                    <button
                      onClick={() => navigate('/')}
                      className="btn-brand mt-4 px-5 py-2.5 text-xs inline-flex"
                    >
                      Ir a Campañas para Donar
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="p-4">Campaña de Recaudación</th>
                          <th className="p-4 text-right">Monto</th>
                          <th className="p-4">Fecha Declaración</th>
                          <th className="p-4">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {donaciones.map(don => (
                          <tr key={don.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-bold text-slate-700">{don.campana?.titulo ?? 'Campaña de la Cooperadora'}</td>
                            <td className="p-4 text-right font-black text-slate-800">
                              ${parseFloat(don.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4 text-slate-400 font-medium">
                              {new Date(don.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-4">
                              {don.estado === 'aprobada' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                  <CheckCircle className="h-3 w-3" /> Aprobada
                                </span>
                              ) : don.estado === 'pendiente' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                  <Clock className="h-3 w-3" /> Pendiente
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                                  <XCircle className="h-3 w-3" /> Rechazada
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SocioPanel;
