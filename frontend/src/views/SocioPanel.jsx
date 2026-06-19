import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import SocioProfile from '../components/socio/SocioProfile';
import CuotasTab from '../components/socio/CuotasTab';
import DonacionesTab from '../components/socio/DonacionesTab';
import {
  User, Heart, CheckCircle, CreditCard, Banknote, AlertCircle, RefreshCw
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
  
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [submittingDniContact, setSubmittingDniContact] = useState(false);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

      // 2. Obtener cuotas periódicas
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
  const handleUpdateProfile = async (formValues) => {
    if (!profile) return;
    
    setSubmittingDniContact(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.put(`/socios/${profile.numero_asociado}`, formValues);
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
  const handleSubscribeMP = async (monto) => {
    const minimo = parseFloat(import.meta.env.VITE_MP_MINIMO_CUOTA || '2000');
    if (!monto || isNaN(monto) || parseFloat(monto) < minimo) {
      setErrorMsg(`El monto mínimo de la suscripción es de $${minimo} ARS.`);
      return;
    }
    setSubmittingSub(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/socios/suscripcion/crear', { monto: parseFloat(monto) });
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
  const handleDeclareTransfer = async (formData) => {
    const minimo = parseFloat(import.meta.env.VITE_MP_MINIMO_CUOTA || '2000');
    if (!formData.monto || isNaN(formData.monto) || parseFloat(formData.monto) < minimo) {
      setErrorMsg(`El monto mínimo de la suscripción/cuota es de $${minimo} ARS.`);
      throw new Error('Monto menor al mínimo');
    }
    setSubmittingTransfer(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/socios/mi-perfil/pagos/declarar', {
        monto: parseFloat(formData.monto),
        numero_comprobante: formData.numero_comprobante,
        comprobante_url: formData.comprobante_url
      });
      setSuccessMsg('¡Comprobante de cuota registrado! Un administrador verificará el movimiento bancario para aprobar el pago.');
      await loadSocioData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al registrar la declaración de transferencia.');
      throw err;
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
            {/* ══════════════ TAB: RESUMEN / MI PERFIL ══════════════ */}
            {activeTab === 'resumen' && (
              <SocioProfile
                profile={profile}
                onUpdate={handleUpdateProfile}
                submitting={submittingDniContact}
              />
            )}

            {/* ══════════════ TAB: CUOTAS SOCIALES (MASHUP) ══════════════ */}
            {activeTab === 'cuotas' && (
              <CuotasTab
                profile={profile}
                cuotas={cuotas}
                payments={payments}
                onSubscribeMP={handleSubscribeMP}
                onCancelSubMP={handleCancelSubMP}
                onDeclareTransfer={handleDeclareTransfer}
                onChangeMethod={changeMethodTo}
                submittingSub={submittingSub}
                submittingTransfer={submittingTransfer}
              />
            )}

            {/* ══════════════ TAB: DONACIONES DECLARADAS ══════════════ */}
            {activeTab === 'donaciones' && (
              <DonacionesTab donaciones={donaciones} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SocioPanel;
