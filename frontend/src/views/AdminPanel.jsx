import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardCharts from '../components/admin/DashboardCharts';
import CampaignForm from '../components/admin/CampaignForm';
import NewsForm from '../components/admin/NewsForm';
import PartnerForm from '../components/admin/PartnerForm';
import {
  Shield, Users, Target, Plus, Pencil, Trash, FileText,
  CheckCircle, Clock, AlertTriangle, LayoutDashboard,
  Newspaper, X, Save, AlertCircle, Sparkles,
  Banknote, XCircle, ChevronDown, ChevronUp, User, MapPin,
  Calendar, Globe, Phone, Info, CreditCard, Search,
  ChevronLeft, ChevronRight
} from 'lucide-react';

/* ── Small stat card in header ── */
const HeaderStat = ({ label, value, icon: Icon, color }) => (
  <div className={`flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm`}>
    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="h-4 w-4 text-white" />
    </div>
    <div>
      <p className="text-lg font-display font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  </div>
);

/* ── Tabs ── */
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'campaigns', label: 'Campañas', icon: Target },
  { id: 'partners',  label: 'Socios',   icon: Users },
  { id: 'news',      label: 'Noticias', icon: Newspaper },
  { id: 'transfers', label: 'Transferencias', icon: Banknote },
  { id: 'cuotas',    label: 'Cuotas Sociales', icon: CreditCard },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [partners, setPartners] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [news, setNews] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [cuotasSearch, setCuotasSearch] = useState('');
  const [transfersSearch, setTransfersSearch] = useState('');
  const [currentTransferPage, setCurrentTransferPage] = useState(1);
  const [expandedPartnerId, setExpandedPartnerId] = useState(null);
  const [editingPartnerId, setEditingPartnerId] = useState(null);

  /* Campaign form */
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);

  /* News form */
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.rol !== 'admin') navigate('/');
  }, [user, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [pRes, cRes, nRes, tRes, cuoRes] = await Promise.all([
        api.get('/socios'),
        api.get('/campanas'),
        api.get('/noticias'),
        api.get('/donaciones/transferencias'),
        api.get('/socios/admin/cuotas?limit=1000')
      ]);
      setPartners(pRes.data);
      setCampaigns(cRes.data);
      setNews(nRes.data);
      setTransfers(tRes.data);
      setCuotas(cuoRes.data.cuotas || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar la información del panel.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Socio editing handlers ── */
  const startEditPartner = (id) => {
    setEditingPartnerId(id);
  };

  const handleSavePartnerDetails = async (id, updatedForm) => {
    const {
      nombre,
      apellido,
      direccion,
      localidad,
      nacionalidad,
      telefono,
      fecha_nacimiento,
      genero,
      metodo_pago
    } = updatedForm;

    if (
      !nombre || !nombre.trim() ||
      !apellido || !apellido.trim() ||
      !direccion || !direccion.trim() ||
      !localidad || !localidad.trim() ||
      !nacionalidad || !nacionalidad.trim() ||
      !telefono || !telefono.trim() ||
      !fecha_nacimiento ||
      !genero ||
      !metodo_pago
    ) {
      setErrorMsg('Todos los campos con asterisco (*) son obligatorios.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.put(`/socios/${id}`, updatedForm);
      setSuccessMsg('Datos del socio actualizados correctamente.');
      setEditingPartnerId(null);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al actualizar los datos del socio.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  /* Auto-dismiss success */
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  /* ── Cuota validation ── */
  const handleValidateCuota = async (id, estado) => {
    if (!window.confirm(`¿Estás seguro de marcar esta cuota como ${estado}?`)) return;
    setSubmitting(true);
    try {
      await api.put(`/socios/admin/cuotas/${id}/validar`, { estado });
      setSuccessMsg(`Cuota ${estado} correctamente.`);
      loadDashboardData();
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.error || 'Error al validar la cuota.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Update partner status ── */
  const handleUpdatePartnerStatus = async (num, newStatus) => {
    if (newStatus === 'inactivo' && !window.confirm('¿Seguro que desea desactivar/rechazar a este socio?')) return;
    setSubmitting(true);
    try {
      await api.put(`/socios/${num}`, { estado: newStatus });
      setSuccessMsg(
        newStatus === 'activo'
          ? 'Socio activado/aprobado correctamente.'
          : 'Socio desactivado correctamente.'
      );
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al actualizar el estado del socio.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete partner ── */
  const handleDeletePartner = async (id) => {
    if (!window.confirm('¿Seguro que desea eliminar por completo a este socio y su cuenta de usuario? Esta acción no se puede deshacer.')) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.delete(`/socios/${id}`);
      setSuccessMsg('Socio y su cuenta eliminados correctamente.');
      if (expandedPartnerId === id) setExpandedPartnerId(null);
      if (editingPartnerId === id) setEditingPartnerId(null);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al eliminar el socio.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // TEAM_001: Aprobar una transferencia declarada por un socio
  const handleApproveTransfer = async (id) => {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.put(`/donaciones/transferencias/${id}/aprobar`);
      setSuccessMsg('Transferencia aprobada con éxito. Fondos acreditados y campaña actualizada.');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al aprobar la transferencia bancaria.');
    } finally {
      setSubmitting(false);
    }
  };

  // TEAM_001: Rechazar una transferencia declarada por un socio
  const handleRejectTransfer = async (id) => {
    if (!confirm('¿Seguro que desea rechazar esta declaración de transferencia?')) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.put(`/donaciones/transferencias/${id}/rechazar`);
      setSuccessMsg('Declaración de transferencia rechazada.');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al rechazar la transferencia.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Save campaign ── */
  const handleSaveCampaign = async (formData) => {
    setErrorMsg(''); setSuccessMsg('');
    const testimonios = (formData.testimoniosText && formData.testimoniosAutor)
      ? [{ autor: formData.testimoniosAutor, texto: formData.testimoniosText }]
      : [];
    const galeria_rica = formData.imagenUrl
      ? { imagenes: [formData.imagenUrl], videos: [] }
      : { imagenes: [], videos: [] };
    const payload = {
      titulo: formData.titulo,
      monto_objetivo: parseFloat(formData.monto_objetivo),
      monto_actual: formData.monto_actual ? parseFloat(formData.monto_actual) : 0,
      fecha_limite: formData.fecha_limite || null,
      es_campana_del_mes: formData.es_campana_del_mes,
      testimonios, galeria_rica, obra_status: formData.obraStatus,
      equipamiento_info: formData.equipamiento_info,
      equipamiento_imagen: formData.equipamiento_imagen,
    };
    try {
      if (editingCampaignId) {
        await api.put(`/campanas/${editingCampaignId}`, payload);
        setSuccessMsg('Campaña actualizada correctamente.');
      } else {
        await api.post('/campanas', payload);
        setSuccessMsg('Nueva campaña híbrida creada exitosamente.');
      }
      resetCampaignForm();
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al guardar la campaña.');
    }
  };

  const resetCampaignForm = () => {
    setShowCampaignForm(false); setEditingCampaignId(null);
  };

  const handleEditCampaign = (id) => {
    setEditingCampaignId(id);
    setShowCampaignForm(true);
  };

  const handleDeleteCampaign = async (id) => {
    if (!confirm('¿Seguro que desea eliminar esta campaña y todo su contenido asociado?')) return;
    setSubmitting(true);
    try {
      await api.delete(`/campanas/${id}`);
      setSuccessMsg('Campaña personalizada eliminada.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg('Error al eliminar la campaña.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Save news ── */
  const handleSaveNews = async (formData) => {
    setErrorMsg(''); setSuccessMsg('');
    const payload = {
      titulo: formData.titulo, cuerpo_html: formData.cuerpo_html,
      tags: [],
      fecha: formData.fecha || undefined,
      imagen_url: formData.imagen_url || undefined,
    };
    try {
      if (editingNewsId) {
        await api.put(`/noticias/${editingNewsId}`, payload);
        setSuccessMsg('Noticia actualizada correctamente.');
      } else {
        await api.post('/noticias', payload);
        setSuccessMsg('Noticia publicada correctamente.');
      }
      resetNewsForm();
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al guardar la noticia.');
    }
  };

  const resetNewsForm = () => {
    setShowNewsForm(false); setEditingNewsId(null);
  };

  const handleEditNews = (n) => {
    setEditingNewsId(n._id);
    setShowNewsForm(true);
    setErrorMsg('');
  };

  const handleDeleteNews = async (id) => {
    if (!confirm('¿Eliminar esta noticia permanentemente?')) return;
    setSubmitting(true);
    try {
      await api.delete(`/noticias/${id}`);
      setSuccessMsg('Noticia eliminada correctamente.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg('Error al eliminar la noticia.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Label helper ── */
  const FormLabel = ({ children }) => (
    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
      {children}
    </label>
  );
  const inputCls = "input-field";


  return (
    <div className="flex-grow bg-slate-50">
      {/* ── Header banner ── */}
      <div className="bg-slate-50 border-b border-slate-200 relative overflow-hidden pt-28">
        <div className="relative max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-black text-slate-900">Panel Administrativo</h1>
                <p className="text-slate-500 text-xs font-medium mt-0.5">
                  Panel de control general — Operador: <span className="text-brand-600 font-bold">{user?.email}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <HeaderStat label="Campañas" value={campaigns.length} icon={Target} color="bg-brand-600" />
              <HeaderStat label="Socios" value={partners.length} icon={Users} color="bg-slate-600" />
              <HeaderStat label="Noticias" value={news.length} icon={Newspaper} color="bg-accent-600" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setShowCampaignForm(false); setShowNewsForm(false); }}
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

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Global alerts */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {errorMsg}
            <button onClick={() => setErrorMsg('')} className="ml-auto text-rose-400 hover:text-rose-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-2xl">
            <CheckCircle className="h-5 w-5 shrink-0" />
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ══════════════ DASHBOARD TAB ══════════════ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-up">
                <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2 mb-4">
                  <LayoutDashboard className="h-5 w-5 text-brand-600" />
                  Métricas y Evolución
                </h2>
                <DashboardCharts transfers={transfers} partners={partners} />
              </div>
            )}

            {/* ══════════════ CAMPAIGNS TAB ══════════════ */}
        {activeTab === 'campaigns' && (
          <div className="space-y-5">
            {/* Campaign Form */}
            {showCampaignForm && (
              <CampaignForm
                campaign={campaigns.find(c => c.id === editingCampaignId)}
                onSave={handleSaveCampaign}
                onCancel={resetCampaignForm}
              />
            )}

            {/* Campaigns list */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-brand-600" />
                  Gestión de Campañas
                </h2>
                <button
                  onClick={() => { resetCampaignForm(); setShowCampaignForm(true); }}
                  className="btn-brand py-2 px-4 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nueva
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Cargando campañas...</div>
              ) : campaigns.length === 0 ? (
                <div className="p-12 text-center">
                  <Target className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-semibold">No hay campañas registradas.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {campaigns.map(camp => {
                    const pct = Math.min(100, Math.round((parseFloat(camp.monto_actual) / parseFloat(camp.monto_objetivo)) * 100));
                    return (
                      <div key={camp.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                        {/* Progress circle */}
                        <div className="shrink-0 h-12 w-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                          <span className="text-sm font-black text-brand-700">{pct}%</span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate flex items-center gap-2">
                            {camp.titulo}
                            {camp.es_campana_del_mes && (
                              <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-brand-100 shrink-0">
                                ★ Campaña del Mes
                              </span>
                            )}
                          </h4>
                          <div className="flex gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            <span>Meta: ${parseFloat(camp.monto_objetivo).toLocaleString('es-AR')}</span>
                            <span className="text-emerald-600">Recaudado: ${parseFloat(camp.monto_actual).toLocaleString('es-AR')}</span>
                          </div>
                          <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-accent-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditCampaign(camp.id)}
                            disabled={submitting}
                            className="p-2 rounded-xl hover:bg-brand-50 hover:text-brand-600 text-slate-400 transition-colors disabled:opacity-40"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(camp.id)}
                            disabled={submitting}
                            className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors disabled:opacity-40"
                            title="Eliminar"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ PARTNERS TAB ══════════════ */}
        {activeTab === 'partners' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                Libro Registro de Asociados
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Gestione los estados de aprobación de los socios.</p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando socios...</div>
            ) : partners.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-semibold">No hay perfiles de socios registrados.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {partners.map(part => {
                  const isExpanded = expandedPartnerId === part.numero_asociado;
                  return (
                    <div key={part.numero_asociado} className="border-b border-slate-50 last:border-none">
                      <div
                        onClick={() => setExpandedPartnerId(isExpanded ? null : part.numero_asociado)}
                        className="flex items-center gap-4 p-5 hover:bg-slate-50/80 transition-colors cursor-pointer animate-fade"
                      >
                        {/* Avatar / Numero */}
                        <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          part.estado === 'activo'
                            ? 'bg-emerald-100 text-emerald-700'
                            : part.estado === 'inactivo'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {part.numero_asociado}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {part.nombre && part.apellido ? `${part.nombre} ${part.apellido}` : part.usuario?.email ?? '—'}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                            <span>DNI: {part.dni}</span>
                            {part.nombre && part.apellido && <span className="normal-case text-slate-400 font-medium">({part.usuario?.email})</span>}
                            {part.localidad && <span>• {part.localidad}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                          {part.estado === 'pendiente' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdatePartnerStatus(part.numero_asociado, 'activo')}
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleUpdatePartnerStatus(part.numero_asociado, 'inactivo')}
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                              >
                                <XCircle className="h-3 w-3" />
                                Rechazar
                              </button>
                            </div>
                          ) : part.estado === 'inactivo' ? (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-black uppercase tracking-wider">
                                <XCircle className="h-3 w-3" />
                                Inactivo
                              </span>
                              <button
                                onClick={() => handleUpdatePartnerStatus(part.numero_asociado, 'activo')}
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Activar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-wider">
                                <CheckCircle className="h-3 w-3" />
                                Activo
                              </span>
                              <button
                                onClick={() => handleUpdatePartnerStatus(part.numero_asociado, 'inactivo')}
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                              >
                                <XCircle className="h-3 w-3" />
                                Desactivar
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => setExpandedPartnerId(isExpanded ? null : part.numero_asociado)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded panel details */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100 space-y-4">
                          {editingPartnerId === part.numero_asociado ? (
                            <PartnerForm
                              partner={part}
                              submitting={submitting}
                              onSave={handleSavePartnerDetails}
                              onCancel={() => setEditingPartnerId(null)}
                            />
                          ) : (
                            <>
                              {/* DISPLAY MODE (Read-only) */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                                {/* Col 1: Datos Personales */}
                                <div className="space-y-2.5">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-brand-500" />
                                    Datos Personales
                                  </h4>
                                  <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-slate-600"><span className="font-bold text-slate-700">Nombre:</span> {part.nombre || '—'}</p>
                                    <p className="text-slate-600"><span className="font-bold text-slate-700">Apellido:</span> {part.apellido || '—'}</p>
                                    <p className="text-slate-600">
                                      <span className="font-bold text-slate-700">F. Nacimiento:</span>{' '}
                                      {part.fecha_nacimiento ? new Date(part.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR') : '—'}
                                    </p>
                                    <p className="text-slate-600 capitalize"><span className="font-bold text-slate-700">Género:</span> {part.genero || '—'}</p>
                                    <p className="text-slate-600"><span className="font-bold text-slate-700">Nacionalidad:</span> {part.nacionalidad || '—'}</p>
                                  </div>
                                </div>

                                {/* Col 2: Contacto y Ubicación */}
                                <div className="space-y-2.5">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-brand-500" />
                                    Contacto y Ubicación
                                  </h4>
                                  <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-slate-600"><span className="font-bold text-slate-700">Teléfono:</span> {part.telefono || '—'}</p>
                                    <p className="text-slate-600"><span className="font-bold text-slate-700">Dirección:</span> {part.direccion || '—'}</p>
                                    <p className="text-slate-600"><span className="font-bold text-slate-700">Localidad:</span> {part.localidad || '—'}</p>
                                  </div>
                                </div>

                                {/* Col 3: Datos Administrativos */}
                                <div className="space-y-2.5">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Shield className="h-3.5 w-3.5 text-brand-500" />
                                    Administración
                                  </h4>
                                  <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <p className="text-slate-600">
                                      <span className="font-bold text-slate-700">Método de Pago:</span>{' '}
                                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-bold text-[10px] uppercase tracking-wide capitalize">
                                        {part.metodo_pago || '—'}
                                      </span>
                                    </p>
                                    <p className="text-slate-600">
                                      <span className="font-bold text-slate-700">Último Pago:</span>{' '}
                                      {part.fecha_ultimo_pago ? new Date(part.fecha_ultimo_pago + 'T00:00:00').toLocaleDateString('es-AR') : '—'}
                                    </p>
                                    <p className="text-slate-600">
                                      <span className="font-bold text-slate-700">Alta Sistema:</span>{' '}
                                      {new Date(part.fecha_alta).toLocaleDateString('es-AR')}
                                    </p>
                                    <div className="mt-2 pt-2 border-t border-slate-100 text-slate-500">
                                      <span className="font-black text-slate-600 text-[10px] uppercase tracking-wider block mb-0.5">Observaciones:</span>
                                      <p className="italic leading-normal">{part.observaciones || 'Sin observaciones registradas.'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* ACTION BUTTONS (At the bottom of the card) */}
                              <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-3">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePartner(part.numero_asociado)}
                                  disabled={submitting}
                                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider rounded-xl text-[10px] transition-colors disabled:opacity-40"
                                >
                                  Eliminar Socio
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditPartner(part.numero_asociado)}
                                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider rounded-xl text-[10px] transition-colors"
                                >
                                  Editar Datos
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ NEWS TAB ══════════════ */}
        {activeTab === 'news' && (
          <div className="space-y-5">
            {/* News Form */}
            {showNewsForm && (
              <NewsForm
                news={news.find(n => n._id === editingNewsId)}
                onSave={handleSaveNews}
                onCancel={resetNewsForm}
              />
            )}

            {/* News list */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-violet-600" />
                  Gestión de Noticias
                </h2>
                <button
                  onClick={() => { resetNewsForm(); setShowNewsForm(true); }}
                  className="btn-brand py-2 px-4 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nueva
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Cargando noticias...</div>
              ) : news.length === 0 ? (
                <div className="p-12 text-center">
                  <Newspaper className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-semibold">No hay noticias publicadas.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {news.map(n => (
                    <div key={n._id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex-grow min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{n.titulo}</h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(n.fecha).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditNews(n)}
                          disabled={submitting}
                          className="p-2 rounded-xl hover:bg-brand-50 hover:text-brand-600 text-slate-400 transition-colors disabled:opacity-40"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNews(n._id)}
                          disabled={submitting}
                          className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TRANSFERS TAB ══════════════ */}
        {activeTab === 'transfers' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-emerald-600" />
                  Donaciones por Transferencia Bancaria
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Gestione y apruebe las declaraciones de transferencia de los socios.</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-64">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por email, socio o DNI..."
                  value={transfersSearch}
                  onChange={(e) => setTransfersSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full font-semibold text-slate-700"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando transferencias...</div>
            ) : transfers.length === 0 ? (
              <div className="p-12 text-center">
                <Banknote className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-semibold">No hay transferencias registradas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Socio</th>
                      <th className="p-4">Campaña</th>
                      <th className="p-4 text-right">Monto</th>
                      <th className="p-4">Comprobante</th>
                      <th className="p-4">Fecha Reporte</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const filteredTransfers = transfers.filter(tr => {
                        const match = transfersSearch.toLowerCase();
                        const email = (tr.usuario?.email || '').toLowerCase();
                        const nombreSocio = `${tr.usuario?.perfilSocio?.nombre || ''} ${tr.usuario?.perfilSocio?.apellido || ''}`.toLowerCase();
                        const dni = String(tr.usuario?.perfilSocio?.dni || '');
                        return email.includes(match) || nombreSocio.includes(match) || dni.includes(match);
                      });

                      const transfersPerPage = 25;
                      const totalTransferPages = Math.ceil(filteredTransfers.length / transfersPerPage);
                      const indexOfLastTransfer = currentTransferPage * transfersPerPage;
                      const indexOfFirstTransfer = indexOfLastTransfer - transfersPerPage;
                      const currentTransfers = filteredTransfers.slice(indexOfFirstTransfer, indexOfLastTransfer);
                      
                      return currentTransfers.map(tr => (
                      <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-700">{tr.usuario?.perfilSocio ? `${tr.usuario.perfilSocio.nombre} ${tr.usuario.perfilSocio.apellido}` : (tr.usuario?.email ?? '—')}</div>
                          {tr.usuario?.perfilSocio && <div className="text-[10px] text-slate-400 font-semibold mt-0.5">DNI: {tr.usuario.perfilSocio.dni} | {tr.usuario.email}</div>}
                        </td>
                        <td className="p-4 text-slate-600 font-semibold">{tr.campana?.titulo ?? '—'}</td>
                        <td className="p-4 text-right font-black text-slate-800">
                          ${parseFloat(tr.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            {tr.numero_comprobante ? (
                              <span className="font-bold text-slate-700">{tr.numero_comprobante}</span>
                            ) : (
                              <span className="text-slate-400 italic">Sin nro.</span>
                            )}
                            {tr.comprobante_url ? (
                              <a
                                href={tr.comprobante_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-brand-600 hover:text-brand-800 font-bold underline flex items-center gap-0.5"
                              >
                                <FileText className="h-3.5 w-3.5 inline" /> Ver captura
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Sin captura</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 font-medium">
                          {new Date(tr.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            tr.estado === 'aprobada'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : tr.estado === 'rechazada'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {tr.estado}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {tr.estado === 'pendiente' ? (
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApproveTransfer(tr.id)}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleRejectTransfer(tr.id)}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                              >
                                <XCircle className="h-3 w-3" />
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Procesada</span>
                          )}
                        </td>
                      </tr>
                    ))})()}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {(() => {
              const filteredTransfers = transfers.filter(tr => {
                const match = transfersSearch.toLowerCase();
                const email = (tr.usuario?.email || '').toLowerCase();
                const nombreSocio = `${tr.usuario?.perfilSocio?.nombre || ''} ${tr.usuario?.perfilSocio?.apellido || ''}`.toLowerCase();
                const dni = String(tr.usuario?.perfilSocio?.dni || '');
                return email.includes(match) || nombreSocio.includes(match) || dni.includes(match);
              });
              const totalPages = Math.ceil(filteredTransfers.length / 25) || 1;

              if (filteredTransfers.length <= 25) return null;

              return (
                <div className="flex items-center justify-center gap-2 p-5 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => setCurrentTransferPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentTransferPage === 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentTransferPage(pageNum)}
                          className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                            currentTransferPage === pageNum
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentTransferPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentTransferPage === totalPages}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══════════════ CUOTAS TAB ══════════════ */}
        {activeTab === 'cuotas' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  Gestión de Cuotas Sociales
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Historial y validación de cuotas de los socios.</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-64">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por socio o DNI..."
                  value={cuotasSearch}
                  onChange={(e) => setCuotasSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full font-semibold text-slate-700"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando cuotas...</div>
            ) : cuotas.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-semibold">No hay cuotas registradas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Socio</th>
                      <th className="p-4 text-right">Monto</th>
                      <th className="p-4">Fecha Pago</th>
                      <th className="p-4">Método</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cuotas.filter(c => {
                       const match = cuotasSearch.toLowerCase();
                       const fullName = `${c.perfilSocio?.nombre || ''} ${c.perfilSocio?.apellido || ''}`.toLowerCase();
                       const dni = String(c.perfilSocio?.dni || '');
                       return fullName.includes(match) || dni.includes(match);
                     }).map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-700">{c.perfilSocio?.nombre} {c.perfilSocio?.apellido}</div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">DNI: {c.perfilSocio?.dni}</div>
                        </td>
                        <td className="p-4 text-right font-black text-slate-800">
                          ${parseFloat(c.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-slate-600 font-semibold">
                          {c.fecha_pago ? new Date(c.fecha_pago).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="p-4 uppercase text-[10px] tracking-wider text-slate-500 font-bold">
                          {c.metodo_pago}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            c.estado === 'aprobado' || c.estado === 'pagado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : c.estado === 'rechazado'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {c.estado === 'pendiente' ? (
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleValidateCuota(c.id, 'aprobado')}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleValidateCuota(c.id, 'rechazado')}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                              >
                                <XCircle className="h-3 w-3" />
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Procesada</span>
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

export default AdminPanel;
