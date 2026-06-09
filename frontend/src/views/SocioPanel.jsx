import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import {
  Heart, Users, Calendar, CreditCard, Edit, CheckCircle,
  AlertCircle, Sparkles, Copy, Check, ArrowRight, X, Clock,
  MapPin, Phone, User, FileText, Banknote
} from 'lucide-react';

const SocioPanel = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Formulario de edición de contacto
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    telefono: '',
    direccion: '',
    localidad: ''
  });

  // Formulario de suscripción de Mercado Pago
  const [subMonto, setSubMonto] = useState('2000');
  const [submittingSub, setSubmittingSub] = useState(false);

  // Formulario de transferencia manual
  const [transferMonto, setTransferMonto] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [transferReceiptUrl, setTransferReceiptUrl] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token]);

  // Verificar si venimos de un callback de suscripción exitoso
  useEffect(() => {
    if (searchParams.get('status') === 'sub_callback') {
      setSuccessMsg('¡Suscripción iniciada correctamente! Los cambios se reflejarán a la brevedad cuando Mercado Pago valide la transacción.');
      // Limpiar query params
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Obtener perfil
      const profileRes = await api.get('/socios/mi-perfil');
      setProfile(profileRes.data);
      setEditForm({
        telefono: profileRes.data.telefono,
        direccion: profileRes.data.direccion,
        localidad: profileRes.data.localidad
      });

      // 2. Obtener historial de pagos
      const paymentsRes = await api.get('/socios/mi-perfil/pagos');
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error('Error fetching socio data:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo cargar la información del perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put(`/socios/${profile.numero_asociado}`, editForm);
      setProfile(res.data.socio);
      setIsEditing(false);
      setSuccessMsg('Datos de contacto actualizados correctamente.');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al actualizar los datos de contacto.');
    }
  };

  const handleSubscribeMP = async (e) => {
    e.preventDefault();
    if (!subMonto || isNaN(subMonto) || parseFloat(subMonto) <= 0) {
      setErrorMsg('Por favor, ingresa un monto válido.');
      return;
    }
    setSubmittingSub(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/socios/suscripcion/crear', { monto: parseFloat(subMonto) });
      // Redireccionar al checkout de Mercado Pago (preferimos sandbox en pruebas, sino normal)
      const checkoutUrl = res.data.sandboxInitPoint || res.data.initPoint;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setErrorMsg('No se pudo generar la URL de Mercado Pago.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al iniciar la suscripción en Mercado Pago.');
      setSubmittingSub(false);
    }
  };

  const handleCancelSubMP = async () => {
    if (!window.confirm('¿Seguro que deseas cancelar el débito automático de tu cuota social? Deberás pagar por transferencia u otro medio para mantenerte activo.')) {
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/socios/suscripcion/cancelar');
      setSuccessMsg('Suscripción cancelada correctamente. El método de pago preferido se actualizó a Transferencia.');
      await fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al cancelar la suscripción.');
      setLoading(false);
    }
  };

  const handleDeclareTransfer = async (e) => {
    e.preventDefault();
    if (!transferMonto || isNaN(transferMonto) || parseFloat(transferMonto) <= 0) {
      setErrorMsg('Por favor, ingresá un monto válido mayor a 0.');
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
      await fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al registrar la declaración de transferencia.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const changeMethodTo = async (newMethod) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put(`/socios/${profile.numero_asociado}`, { metodo_pago: newMethod });
      setProfile(res.data.socio);
      setSuccessMsg(`Método de pago cambiado a ${newMethod.toUpperCase()} con éxito.`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cambiar el método de pago.');
    }
  };

  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (loading && !profile) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh] bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-600" />
          <p className="text-slate-500 font-medium text-sm">Cargando panel de socio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* BANNER HEADER */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-accent-700 to-teal-900 text-white p-8 sm:p-10 shadow-card border border-teal-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/30 rounded-full blur-[100px] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                <Heart className="h-3.5 w-3.5 fill-current" />
                Socio Registrado
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight leading-none">
                ¡Hola, {profile?.nombre}!
              </h1>
              <p className="text-emerald-100 text-sm font-medium">
                Gracias por apoyar al Hospital Municipal Dr. Emilio Ferreyra
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 shrink-0 flex flex-col items-start md:items-end">
              <span className="text-[10px] text-emerald-200 font-black uppercase tracking-widest">Nº Asociado</span>
              <span className="text-2xl font-display font-black leading-none my-1">
                #{String(profile?.numero_asociado).padStart(4, '0')}
              </span>
              <span className="text-xs text-emerald-200">
                Alta: {profile?.fecha_alta ? new Date(profile.fecha_alta).toLocaleDateString('es-AR') : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* MENSAJES DE ALERTA */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl animate-fade-up">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-2xl animate-fade-up">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* COL IZQUIERDA: DATOS PERSONALES */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-accent-600" />
                  Datos Personales
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-accent-600 hover:text-accent-700 transition-colors flex items-center gap-1 bg-accent-50 px-3 py-1.5 rounded-lg border border-accent-100"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateContact} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={editForm.telefono}
                      onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                      className="input-field py-2.5 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={editForm.direccion}
                      onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                      className="input-field py-2.5 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                      Localidad
                    </label>
                    <input
                      type="text"
                      value={editForm.localidad}
                      onChange={(e) => setEditForm({ ...editForm, localidad: e.target.value })}
                      className="input-field py-2.5 text-sm"
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-grow btn-brand py-2.5 text-xs justify-center"
                    >
                      Guardar Cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          telefono: profile.telefono,
                          direccion: profile.direccion,
                          localidad: profile.localidad
                        });
                      }}
                      className="btn-outline py-2.5 text-xs text-slate-500 border-slate-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Nombre y Apellido</p>
                      <p className="text-slate-800 font-semibold mt-1">{profile?.nombre} {profile?.apellido}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">DNI / Documento</p>
                      <p className="text-slate-800 font-semibold mt-1">{profile?.dni}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Teléfono de contacto</p>
                      <p className="text-slate-800 font-semibold mt-1">{profile?.telefono}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Domicilio de Cobro / Contacto</p>
                      <p className="text-slate-800 font-semibold mt-1">{profile?.direccion}, {profile?.localidad}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COL DERECHA: ESTADO DE CUOTA Y PAGOS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CARD ESTADO DE CUOTA */}
            <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-6">
              <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-100">
                <CreditCard className="h-5 w-5 text-accent-600" />
                Estado de la Cuota Social
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Badge Estado */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Estado de Membresía</span>
                  <div>
                    {profile?.estado === 'activo' ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-black border border-emerald-200">
                        <CheckCircle className="h-3.5 w-3.5" />
                        ACTIVO (Al día)
                      </span>
                    ) : profile?.estado === 'pendiente' ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-black border border-amber-200">
                        <Clock className="h-3.5 w-3.5" />
                        PENDIENTE DE PAGO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-black border border-slate-200">
                        <X className="h-3.5 w-3.5" />
                        INACTIVO
                      </span>
                    )}
                  </div>
                </div>

                {/* Ultimo Pago */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Último Pago Registrado</span>
                  <p className="text-lg font-display font-black text-slate-800 mt-1 flex items-center gap-1.5">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    {profile?.fecha_ultimo_pago ? new Date(profile.fecha_ultimo_pago).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 'Sin registros'}
                  </p>
                </div>
              </div>

              {/* OPCIONES SEGUN METODO DE PAGO */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Método de Pago Preferido
                  </label>
                  <div className="flex gap-2">
                    {['debito', 'transferencia', 'cobrador'].map((method) => (
                      <button
                        key={method}
                        onClick={() => {
                          if (method === 'debito' && profile.mp_subscription_status === 'authorized') return;
                          changeMethodTo(method);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-all ${
                          profile?.metodo_pago === method
                            ? 'bg-accent-600 border-accent-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        disabled={method === 'debito' && profile.mp_subscription_status === 'authorized'}
                      >
                        {method === 'debito' ? 'Débito MP' : method === 'transferencia' ? 'Transferencia' : 'Cobrador'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PANEL DE DÉBITO AUTOMÁTICO (MERCADO PAGO) */}
                {profile?.metodo_pago === 'debito' && (
                  <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Suscripción recurrente con Mercado Pago</h4>
                        <p className="text-xs text-slate-500">Monto automático descontado todos los meses.</p>
                      </div>
                    </div>

                    {profile.mp_subscription_status === 'authorized' ? (
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Estado en Mercado Pago:</span>
                          <span className="text-emerald-600 font-black uppercase text-xs flex items-center gap-1">
                            <Check className="h-4 w-4" /> Suscripción Activa
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Monto a pagar por mes:</span>
                          <span className="text-slate-900 font-black">{formatter.format(profile.monto_cuota)}</span>
                        </div>
                        <button
                          onClick={handleCancelSubMP}
                          className="w-full btn-outline text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 py-2 justify-center text-xs mt-2"
                        >
                          Cancelar Débito Automático
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubscribeMP} className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-600">
                            Elegí cuánto querés aportar mensualmente ($) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                            <input
                              type="number"
                              min={import.meta.env.VITE_MP_MINIMO_CUOTA || '1000'}
                              value={subMonto}
                              onChange={(e) => setSubMonto(e.target.value)}
                              className="input-field pl-7 py-2.5 text-sm"
                              required
                              disabled={submittingSub}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">
                            El monto mínimo es de ${import.meta.env.VITE_MP_MINIMO_CUOTA || '1000'} ARS. Podés aumentarlo si deseás colaborar más.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={submittingSub}
                          className="w-full btn-brand py-3 text-sm justify-center"
                        >
                          <CreditCard className="h-4 w-4" />
                          {submittingSub ? 'Cargando Mercado Pago...' : 'Adherirme a Débito Automático'}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* PANEL DE TRANSFERENCIA BANCARIA */}
                {profile?.metodo_pago === 'transferencia' && (
                  <div className="space-y-4">
                    {/* CBU BOX */}
                    <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3 text-xs shadow-sm">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-medium">Banco:</span>
                        <span className="text-slate-800 font-black">Banco Provincia</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-medium">Titular:</span>
                        <span className="text-slate-800 font-black">Asoc. Cooperadora Hosp. Ferreyra</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-medium">Alias:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-150">cooperadora.hospital.nec</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('cooperadora.hospital.nec');
                              setCopiedAlias(true);
                              setTimeout(() => setCopiedAlias(false), 2000);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                          >
                            {copiedAlias ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">CBU:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-150">0140354701354701354701</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('0140354701354701354701');
                              setCopiedCbu(true);
                              setTimeout(() => setCopiedCbu(false), 2000);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                          >
                            {copiedCbu ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* DECLARAR TRANSFERENCIA FORM */}
                    <form onSubmit={handleDeclareTransfer} className="bg-white p-5 border border-slate-150 rounded-2xl space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Banknote className="h-4 w-4 text-emerald-600" />
                        Declarar pago de cuota
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                            Monto transferido ($) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                            <input
                              type="number"
                              min="1"
                              value={transferMonto}
                              onChange={(e) => setTransferMonto(e.target.value)}
                              placeholder="2000"
                              className="input-field pl-7 py-2.5 text-xs"
                              required
                              disabled={submittingTransfer}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                            Nº Transacción / Comprobante
                          </label>
                          <input
                            type="text"
                            value={transferNumber}
                            onChange={(e) => setTransferNumber(e.target.value)}
                            placeholder="Ej: TXN-54321"
                            className="input-field py-2.5 text-xs"
                            disabled={submittingTransfer}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                            URL de captura de comprobante
                          </label>
                          <input
                            type="url"
                            value={transferReceiptUrl}
                            onChange={(e) => setTransferReceiptUrl(e.target.value)}
                            placeholder="https://imagencomprobante.com/pago.jpg"
                            className="input-field py-2.5 text-xs"
                            disabled={submittingTransfer}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingTransfer}
                        className="w-full btn-accent py-2.5 text-xs justify-center mt-2"
                      >
                        {submittingTransfer ? 'Registrando comprobante...' : 'Enviar Declaración de Pago'}
                      </button>
                    </form>
                  </div>
                )}

                {/* PANEL DE COBRADOR O EFECTIVO */}
                {(profile?.metodo_pago === 'cobrador' || profile?.metodo_pago === 'efectivo') && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm space-y-3">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {profile?.metodo_pago === 'cobrador'
                        ? 'Has seleccionado el cobro a través de un cobrador a domicilio. El cobrador pasará por tu domicilio registrado a principios de cada mes.'
                        : 'Has seleccionado el cobro en efectivo. Puedes acercarte a la administración de la Cooperadora en el Hospital para abonar tu cuota.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        onClick={() => changeMethodTo('debito')}
                        className="btn-brand py-2 text-xs justify-center"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Quiero adherirme a Débito Automático
                      </button>
                      <button
                        onClick={() => changeMethodTo('transferencia')}
                        className="btn-outline py-2 text-xs text-slate-600 border-slate-200 hover:bg-slate-100 justify-center"
                      >
                        Quiero pagar por Transferencia
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HISTORIAL DE PAGOS */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-6">
          <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-100">
            <Clock className="h-5 w-5 text-accent-600" />
            Historial de Cuotas Abonadas
          </h2>

          {payments.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Banknote className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">No se registran cuotas abonadas en el historial.</p>
              <p className="text-xs text-slate-400 mt-1">Tus cobros aparecerán aquí una vez que impacten en el sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Monto</th>
                    <th className="p-4">Método</th>
                    <th className="p-4">ID Transacción</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((pago) => (
                    <tr key={pago.id} className="text-slate-700 font-medium hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        {new Date(pago.fecha_pago).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {formatter.format(pago.monto)}
                      </td>
                      <td className="p-4 uppercase text-xs font-bold text-slate-500">
                        {pago.metodo_pago === 'debito' ? 'Débito MP' : pago.metodo_pago}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">
                        {pago.mp_payment_id || pago.numero_comprobante || 'N/A'}
                      </td>
                      <td className="p-4">
                        {pago.estado === 'aprobado' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-black border border-emerald-100 uppercase">
                            <Check className="h-3 w-3" /> Aprobado
                          </span>
                        ) : pago.estado === 'pendiente' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-black border border-amber-100 uppercase">
                            <Clock className="h-3 w-3" /> Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 px-2 py-1 rounded-full font-black border border-rose-100 uppercase">
                            <X className="h-3 w-3" /> Rechazado
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
    </div>
  );
};

export default SocioPanel;
