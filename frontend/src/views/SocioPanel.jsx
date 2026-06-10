import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import {
  User, Heart, CheckCircle, Clock, XCircle,
  CreditCard, Banknote, Calendar, ShieldAlert,
  Save, AlertCircle, RefreshCw, Edit, Copy, Check,
  ArrowRight, X, Phone, MapPin, FileText
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('resumen');
  
  // Datos del socio
  const [profile, setProfile] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [donaciones, setDonaciones] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Formularios y estados de carga
  const [loading, setLoading] = useState(true);
  const [submittingDniContact, setSubmittingDniContact] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados de edición del perfil
  const [dniInput, setDniInput] = useState('');
  const [telInput, setTelInput] = useState('');
  const [dirInput, setDirInput] = useState('');
  const [locInput, setLocInput] = useState('');

  // Formulario de suscripción de Mercado Pago
  const [subMonto, setSubMonto] = useState('2000');
  const [submittingSub, setSubmittingSub] = useState(false);

  // Formulario de transferencia manual (para cuotas)
  const [transferMonto, setTransferMonto] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [transferReceiptUrl, setTransferReceiptUrl] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Verificar si venimos de un callback de suscripción exitoso
  useEffect(() => {
    if (searchParams.get('status') === 'sub_callback') {
      setSuccessMsg('¡Suscripción iniciada correctamente! Los cambios se reflejarán a la brevedad cuando Mercado Pago valide la transacción.');
      // Limpiar query params
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // Limpiar mensaje de éxito después de unos segundos
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 5000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const loadSocioData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Obtener perfil
      const profileRes = await api.get('/socios/mi-perfil');
      const profileData = profileRes.data;
      setProfile(profileData);
      setDniInput(profileData && profileData.dni ? profileData.dni.toString() : '');
      setTelInput(profileData && profileData.telefono ? profileData.telefono : '');
      setDirInput(profileData && profileData.direccion ? profileData.direccion : '');
      setLocInput(profileData && profileData.localidad ? profileData.localidad : '');

      // 2. Obtener cuotas periódicas (compañeros)
      try {
        const cuotasRes = await api.get('/socios/mi-perfil/cuotas');
        setCuotas(cuotasRes.data.cuotas || []);
      } catch (cuotaErr) {
        console.error('Error al cargar cuotas:', cuotaErr);
        setCuotas([]);
      }

      // 3. Obtener donaciones a campañas
      try {
        const donacionesRes = await api.get('/donaciones/mis-donaciones');
        setDonaciones(donacionesRes.data || []);
      } catch (donacionErr) {
        console.error('Error al cargar donaciones:', donacionErr);
        setDonaciones([]);
      }

      // 4. Obtener pagos/transacciones de cuotas (locales)
      try {
        const paymentsRes = await api.get('/socios/mi-perfil/pagos');
        setPayments(paymentsRes.data || []);
      } catch (paymentErr) {
        console.error('Error al cargar pagos:', paymentErr);
        setPayments([]);
      }
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
    loadSocioData();
  }, []);

  // Actualizar DNI, teléfono, dirección y localidad
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    
    setSubmittingDniContact(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.put(`/socios/${profile.numero_asociado}`, {
        dni: parseInt(dniInput),
        telefono: telInput.trim(),
        direccion: dirInput.trim(),
        localidad: locInput.trim()
      });
      setSuccessMsg('Datos actualizados correctamente.');
      setProfile(res.data.socio);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al actualizar los datos.');
    } finally {
      setSubmittingDniContact(false);
    }
  };

  // Iniciar flujo de suscripción en Mercado Pago
  const handleSubscribeMP = async (e) => {
    e.preventDefault();
    const minimo = parseFloat(import.meta.env.VITE_MP_MINIMO_CUOTA || '2000');
    if (!subMonto || isNaN(subMonto) || parseFloat(subMonto) < minimo) {
      setErrorMsg(`El monto mínimo de la suscripción es de $${minimo} ARS.`);
      return;
    }
    setSubmittingSub(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/socios/suscripcion/crear', { monto: parseFloat(subMonto) });
      const checkoutUrl = res.data.sandboxInitPoint || res.data.initPoint;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setErrorMsg('No se pudo generar la URL de Mercado Pago.');
        setSubmittingSub(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al iniciar la suscripción en Mercado Pago.');
      setSubmittingSub(false);
    }
  };

  // Cancelar débito automático
  const handleCancelSubMP = async () => {
    if (!window.confirm('¿Seguro que deseas cancelar el débito automático de tu cuota social? Deberás pagar por transferencia u otro medio para mantenerte activo.')) {
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/socios/suscripcion/cancelar');
      setSuccessMsg('Tu suscripción de débito automático ha sido cancelada con éxito.');
      await loadSocioData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al cancelar la suscripción.');
      setLoading(false);
    }
  };

  // Declarar transferencia de pago de cuota
  const handleDeclareTransfer = async (e) => {
    e.preventDefault();
    const minimo = parseFloat(import.meta.env.VITE_MP_MINIMO_CUOTA || '2000');
    if (!transferMonto || isNaN(transferMonto) || parseFloat(transferMonto) < minimo) {
      setErrorMsg(`El monto mínimo de la suscripción/cuota es de $${minimo} ARS.`);
      return;
    }
    setSubmittingTransfer(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/socios/mi-perfil/pagos/declarar', {
        monto: parseFloat(transferMonto),
        numero_comprobante: transferNumber,
        comprobante_url: transferReceiptUrl
      });
      setSuccessMsg('¡Comprobante de cuota registrado! Un administrador verificará el movimiento bancario para aprobar el pago.');
      setTransferMonto('');
      setTransferNumber('');
      setTransferReceiptUrl('');
      await loadSocioData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al registrar la declaración de transferencia.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // Cambiar método de pago preferido
  const changeMethodTo = async (newMethod) => {
    const confirmChange = window.confirm(`¿Estás seguro de que deseas cambiar tu método de pago preferido a ${
      newMethod === 'debito' ? 'Débito Automático Mercado Pago' : newMethod === 'transferencia' ? 'Transferencia (CBU/Alias)' : 'Cobrador a Domicilio'
    }?`);
    if (!confirmChange) return;

    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put(`/socios/${profile.numero_asociado}`, { metodo_pago: newMethod });
      setProfile(res.data.socio);
      setSuccessMsg(`Método de pago cambiado a ${newMethod.toUpperCase()} con éxito.`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al cambiar el método de pago.');
    }
  };

  // Métricas rápidas en cabecera
  const totalDonado = (donaciones || [])
    .filter(d => d.estado === 'aprobada')
    .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

  // Filtrar cuotas para sólo procesar cuotas periódicas emitidas reales
  const periodicCuotas = (cuotas || []).filter(c => c.mes !== null && c.mes !== undefined && c.anio !== null && c.anio !== undefined);
  const cuotasPagas = periodicCuotas.filter(c => c.estado === 'pagado').length;
  const cuotasPendientes = periodicCuotas.filter(c => c.estado === 'pendiente').length;

  // Filtrar transacciones para sólo mostrar pagos reales (excluyendo facturas/cuotas impagas sin procesar)
  const actualPayments = (payments || []).filter(p => p.fecha_pago !== null || p.metodo_pago !== null);

  if (loading && !profile) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh] bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Cargando panel de socio...</p>
        </div>
      </div>
    );
  }

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
          {profile && (
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
          )}
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
        ) : !profile ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 max-w-xl mx-auto shadow-sm animate-fade-up">
            <div className="h-16 w-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <User className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-display font-black text-slate-800">Perfil de Socio no Asignado</h2>
            <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto">
              Tu cuenta de usuario <span className="font-bold text-slate-700">{user?.email}</span> aún no tiene un perfil de socio asociado en el Libro de Registro de la Cooperadora.
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed max-w-md mx-auto">
              Si acabás de registrarte, por favor aguardá a que un administrador valide y vincule tu perfil, o ponete en contacto con la administración.
            </p>
          </div>
        ) : (
          <>
            {/* ══════════════ TAB: RESUMEN / MI PERFIL ══════════════ */}
            {activeTab === 'resumen' && (
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

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        DNI
                      </label>
                      <input
                        type="number"
                        required
                        value={dniInput}
                        onChange={e => setDniInput(e.target.value)}
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
                        value={telInput}
                        onChange={e => setTelInput(e.target.value)}
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
                        value={dirInput}
                        onChange={e => setDirInput(e.target.value)}
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
                        value={locInput}
                        onChange={e => setLocInput(e.target.value)}
                        className="input-field"
                        placeholder="Localidad"
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal">
                      Podés corregir tu DNI, cambiar tu teléfono o tu domicilio de contacto. Para otras modificaciones, contactate con la administración.
                    </p>

                    <button
                      type="submit"
                      disabled={
                        submittingDniContact ||
                        (dniInput === (profile?.dni ? profile.dni.toString() : '') &&
                         telInput === (profile?.telefono || '') &&
                         dirInput === (profile?.direccion || '') &&
                         locInput === (profile?.localidad || ''))
                      }
                      className="btn-brand w-full py-3 text-xs uppercase tracking-wider shadow-sm disabled:opacity-50"
                    >
                      {submittingDniContact ? 'Guardando...' : 'Actualizar Información'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ══════════════ TAB: CUOTAS SOCIALES (MASHUP) ══════════════ */}
            {activeTab === 'cuotas' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-up">
                
                {/* COL IZQUIERDA: HISTORIAL DE PERÍODOS Y HISTORIAL DE TRANSACCIONES */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Card 1: Estado de Aportes por Período (compañeros) */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-brand-600" />
                          Historial de Cuotas Sociales
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Estado de tus aportaciones por período mensual de facturación.</p>
                      </div>
                      <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl">Pendientes: {cuotasPendientes}</span>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">Pagas: {cuotasPagas}</span>
                      </div>
                    </div>

                    {periodicCuotas.length === 0 ? (
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
                            {periodicCuotas.map(cuota => {
                              const fechaObj = new Date(cuota.anio, cuota.mes - 1, 1);
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

                  {/* Card 2: Historial de Transacciones (locales) */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-brand-600" />
                        Historial de Transacciones Procesadas
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">Registro y estado de cada pago declarado o procesado de forma automática.</p>
                    </div>

                    {actualPayments.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Banknote className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold">No se registran transacciones de cuotas aún.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                              <th className="p-4">Fecha</th>
                              <th className="p-4 text-right">Monto</th>
                              <th className="p-4">Método</th>
                              <th className="p-4">Comprobante / ID</th>
                              <th className="p-4">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {actualPayments.map(pago => (
                              <tr key={pago.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                  {pago.fecha_pago
                                    ? new Date(pago.fecha_pago).toLocaleDateString('es-AR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : '—'
                                  }
                                </td>
                                <td className="p-4 text-right font-black text-slate-800">
                                  ${parseFloat(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-4 uppercase font-bold text-slate-500">
                                  {pago.metodo_pago === 'debito' ? 'Débito MP' : pago.metodo_pago}
                                </td>
                                <td className="p-4 font-mono text-[10px] text-slate-400">
                                  {pago.mp_payment_id || pago.numero_comprobante || 'N/A'}
                                </td>
                                <td className="p-4">
                                  {pago.estado === 'aprobado' || pago.estado === 'pagado' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                                      <CheckCircle className="h-3 w-3" /> Aprobado
                                    </span>
                                  ) : pago.estado === 'pendiente' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">
                                      <Clock className="h-3 w-3 animate-pulse" /> Pendiente
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase">
                                      <XCircle className="h-3 w-3" /> Rechazado
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
                </div>

                {/* COL DERECHA: SELECCIÓN DE MÉTODO DE PAGO Y FORMULARIOS DE PAGO */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Selector y configuración de método de pago */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
                    <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <CreditCard className="h-5 w-5 text-brand-600" />
                      Medio de Pago Preferido
                    </h2>

                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-slate-500">Seleccioná cómo preferís abonar tu cuota social:</p>
                      <div className="flex gap-2">
                        {['debito', 'transferencia', 'cobrador'].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => {
                              if (method === 'debito' && profile.mp_subscription_status === 'authorized') return;
                              changeMethodTo(method);
                            }}
                            className={`flex-grow text-xs px-2.5 py-2 rounded-xl font-black uppercase tracking-wider border transition-all ${
                              profile?.metodo_pago === method
                                ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                            disabled={method === 'debito' && profile.mp_subscription_status === 'authorized'}
                          >
                            {method === 'debito' ? 'Débito MP' : method === 'transferencia' ? 'CBU / Alias' : 'Cobrador'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Contenedor dinámico según método preferido */}
                    
                    {/* Débito automático (Mercado Pago) */}
                    {profile?.metodo_pago === 'debito' && (
                      <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800">Suscripción Mercado Pago</h4>
                            <p className="text-[10px] text-slate-500">Débito automático mensual de tu cuota.</p>
                          </div>
                        </div>

                        {profile.mp_subscription_status === 'authorized' ? (
                          <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Estado de suscripción:</span>
                              <span className="text-emerald-600 font-black uppercase text-[10px] flex items-center gap-1">
                                <Check className="h-3 w-3" /> Activa
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Monto mensual aportado:</span>
                              <span className="text-slate-950 font-black">${parseFloat(profile.monto_cuota).toLocaleString('es-AR')}</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleCancelSubMP}
                              className="w-full btn-outline text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 py-2 justify-center text-xs mt-2"
                            >
                              Cancelar Débito Automático
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleSubscribeMP} className="space-y-4">
                            <div className="space-y-1.5 text-xs">
                              <label className="block font-bold text-slate-600">
                                Elegí el monto del aporte mensual ($)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                                <input
                                  type="number"
                                  min={import.meta.env.VITE_MP_MINIMO_CUOTA || '2000'}
                                  value={subMonto}
                                  onChange={(e) => setSubMonto(e.target.value)}
                                  className="input-field pl-7 py-2 text-xs"
                                  required
                                  disabled={submittingSub}
                                />
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal leading-relaxed">
                                El monto mínimo es de ${import.meta.env.VITE_MP_MINIMO_CUOTA || '2000'} ARS. Podés ingresar un monto mayor si deseás colaborar más.
                              </p>
                            </div>

                            <button
                              type="submit"
                              disabled={submittingSub}
                              className="w-full btn-brand py-2.5 text-xs justify-center uppercase tracking-wider font-bold"
                            >
                              <CreditCard className="h-3.5 w-3.5 animate-pulse" />
                              {submittingSub ? 'Redirigiendo...' : 'Adherirme a Débito Automático'}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Transferencia bancaria */}
                    {profile?.metodo_pago === 'transferencia' && (
                      <div className="space-y-4">
                        {/* CBU/Alias Box */}
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-[11px] shadow-sm">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400">Banco:</span>
                            <span className="text-slate-800 font-bold">Banco Provincia</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400">Titular:</span>
                            <span className="text-slate-800 font-bold">Asoc. Cooperadora Hosp. Ferreyra</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400">Alias:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">cooperadora.hospital.nec</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('cooperadora.hospital.nec');
                                  setCopiedAlias(true);
                                  setTimeout(() => setCopiedAlias(false), 2000);
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors flex items-center justify-center"
                              >
                                {copiedAlias ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">CBU:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">0140354701354701354701</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('0140354701354701354701');
                                  setCopiedCbu(true);
                                  setTimeout(() => setCopiedCbu(false), 2000);
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors flex items-center justify-center"
                              >
                                {copiedCbu ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Declarar pago de cuota */}
                        <form onSubmit={handleDeclareTransfer} className="bg-white p-4 border border-slate-200 rounded-2xl space-y-3.5 shadow-sm">
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Banknote className="h-4 w-4 text-emerald-600" />
                            Declarar Transferencia de Cuota
                          </h4>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 font-bold uppercase">
                                Monto transferido ($) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                                <input
                                  type="number"
                                  min={import.meta.env.VITE_MP_MINIMO_CUOTA || '2000'}
                                  value={transferMonto}
                                  onChange={(e) => setTransferMonto(e.target.value)}
                                  placeholder="2000"
                                  className="input-field pl-7 py-2 text-xs"
                                  required
                                  disabled={submittingTransfer}
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 font-bold uppercase">
                                Nº Transacción / Comprobante
                              </label>
                              <input
                                type="text"
                                value={transferNumber}
                                onChange={(e) => setTransferNumber(e.target.value)}
                                placeholder="Ej: TXN-54321"
                                className="input-field py-2 text-xs"
                                disabled={submittingTransfer}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 font-bold uppercase">
                                URL de captura de comprobante
                              </label>
                              <input
                                type="url"
                                value={transferReceiptUrl}
                                onChange={(e) => setTransferReceiptUrl(e.target.value)}
                                placeholder="https://imagencomprobante.com/pago.jpg"
                                className="input-field py-2 text-xs"
                                disabled={submittingTransfer}
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={submittingTransfer}
                            className="w-full btn-brand py-2 text-xs justify-center mt-2 uppercase tracking-wider font-bold"
                          >
                            {submittingTransfer ? 'Registrando...' : 'Declarar Pago'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Cobrador a domicilio */}
                    {profile?.metodo_pago === 'cobrador' && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
                        <p className="text-slate-600 font-medium leading-relaxed">
                          Has seleccionado el cobro a través de un cobrador a domicilio. El cobrador pasará por tu domicilio registrado a principios de cada mes.
                        </p>
                        <p className="text-slate-400 text-[10px] leading-normal">
                          Por favor, asegurate de que tu domicilio y tu teléfono de contacto en la pestaña <strong>Mi Resumen</strong> estén actualizados.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
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
