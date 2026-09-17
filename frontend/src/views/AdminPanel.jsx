import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DashboardCharts from '../components/admin/DashboardCharts';
import CampaignForm from '../components/admin/CampaignForm';
import NewsForm from '../components/admin/NewsForm';
import AdminModal from '../components/admin/AdminModal';
import AdminHeader from '../components/admin/AdminHeader';
import AdminPartnersTab from '../components/admin/AdminPartnersTab';
import AdminTransfersTab from '../components/admin/AdminTransfersTab';
import AdminCuotasTab from '../components/admin/AdminCuotasTab';
import {
  LayoutDashboard, Target, Newspaper, Plus, Pencil,
  Trash, AlertCircle, CheckCircle, X, Sparkles, Search
} from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [partners, setPartners] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [news, setNews] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [cuotas, setCuotas] = useState([]);

  /* Campaign form & filter state */
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [campaignFilter, setCampaignFilter] = useState('todas'); // 'todas' | 'activas' | 'inactivas' | 'terminadas'
  const [campaignSearch, setCampaignSearch] = useState('');

  /* News form state */
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    if (user && user.rol !== 'admin') navigate('/');
  }, [user, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [pRes, cRes, nRes, tRes, cuoRes] = await Promise.all([
        api.get('/socios'),
        api.get('/campanas?include_inactive=true&all=true'),
        api.get('/noticias'),
        api.get('/donaciones/transferencias'),
        api.get('/socios/admin/cuotas?limit=1000')
      ]);
      setPartners(pRes.data);
      setCampaigns(cRes.data);
      setNews(nRes.data);
      setTransfers(tRes.data);
      setCuotas(cuoRes.data.cuotas || cuoRes.data || []);
    } catch (err) {
      setErrorMsg('Error al sincronizar datos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  /* ── Campaign Handlers ── */
  const resetCampaignForm = () => {
    setEditingCampaignId(null);
    setShowCampaignForm(false);
  };

  const startEditCampaign = (camp) => {
    setEditingCampaignId(camp.id);
    setShowCampaignForm(true);
  };

  const handleSaveCampaign = async (formData) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editingCampaignId) {
        await api.put(`/campanas/${editingCampaignId}`, formData);
        setSuccessMsg('Campaña actualizada con éxito.');
      } else {
        await api.post('/campanas', formData);
        setSuccessMsg('Campaña creada exitosamente.');
      }
      resetCampaignForm();
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al guardar la campaña.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta campaña permanentemente?')) return;
    setSubmitting(true);
    try {
      await api.delete(`/campanas/${id}`);
      setSuccessMsg('Campaña eliminada.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg('Error al eliminar la campaña.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCampaignActive = async (camp) => {
    try {
      await api.put(`/campanas/${camp.id}`, { activo: !camp.activo });
      setSuccessMsg(`Campaña ${camp.activo ? 'desactivada' : 'activada'}.`);
      loadDashboardData();
    } catch (err) {
      setErrorMsg('Error al cambiar el estado de la campaña.');
    }
  };

  /* ── News Handlers ── */
  const resetNewsForm = () => {
    setEditingNewsId(null);
    setShowNewsForm(false);
  };

  const startEditNews = (item) => {
    setEditingNewsId(item._id);
    setShowNewsForm(true);
  };

  const handleSaveNews = async (formData) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editingNewsId) {
        await api.put(`/noticias/${editingNewsId}`, formData);
        setSuccessMsg('Noticia actualizada.');
      } else {
        await api.post('/noticias', formData);
        setSuccessMsg('Noticia publicada.');
      }
      resetNewsForm();
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al guardar la noticia.');
    } finally {
      setSubmitting(false);
    }
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

  /* ── Partner Handlers ── */
  const handleUpdatePartnerStatus = async (partnerId, newStatus) => {
    setSubmitting(true);
    try {
      await api.put(`/socios/${partnerId}`, { estado: newStatus });
      setSuccessMsg(`Estado del socio actualizado a "${newStatus}".`);
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al cambiar estado del socio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePartnerDetails = async (partnerIdOrData, maybeData) => {
    setSubmitting(true);
    try {
      const numeroAsociado = maybeData ? partnerIdOrData : partnerIdOrData?.numero_asociado;
      const data = maybeData || partnerIdOrData;
      await api.put(`/socios/${numeroAsociado}`, data);
      setSuccessMsg('Datos del socio actualizados.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al actualizar datos del socio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePartner = async (partnerId) => {
    const confirmDelete = confirm('¿Desea dar de baja a este socio?');
    if (!confirmDelete) return;

    const purgar = confirm('¿Desea anonimizar los datos personales sensibles del socio manteniendo la trazabilidad contable?');
    setSubmitting(true);
    try {
      await api.delete(`/socios/${partnerId}?purgarDatos=${purgar ? 'true' : 'false'}`);
      setSuccessMsg('Baja de socio procesada exitosamente.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al procesar la baja del socio.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Transfer Handlers ── */
  const handleApproveTransfer = async (id) => {
    setSubmitting(true);
    try {
      await api.put(`/donaciones/transferencias/${id}/aprobar`);
      setSuccessMsg('Transferencia aprobada con éxito.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al aprobar la transferencia.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectTransfer = async (id) => {
    if (!confirm('¿Rechazar esta declaración de transferencia?')) return;
    setSubmitting(true);
    try {
      await api.put(`/donaciones/transferencias/${id}/rechazar`);
      setSuccessMsg('Transferencia rechazada.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al rechazar la transferencia.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Cuota Handlers ── */
  const handleValidateCuota = async (id, estado) => {
    setSubmitting(true);
    try {
      await api.put(`/socios/admin/cuotas/${id}/validar`, { estado });
      setSuccessMsg(`Cuota marcada como ${estado}.`);
      loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al validar la cuota.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Campaign Filters & Helpers ── */
  const isCampaignFinished = (c) => parseFloat(c.monto_objetivo) > 0 && parseFloat(c.monto_actual) >= parseFloat(c.monto_objetivo);
  const isCampaignActive = (c) => Boolean(c.activo) && !isCampaignFinished(c);
  const isCampaignInactive = (c) => !c.activo;

  const campaignCounts = useMemo(() => ({
    todas: campaigns.length,
    activas: campaigns.filter(isCampaignActive).length,
    inactivas: campaigns.filter(isCampaignInactive).length,
    terminadas: campaigns.filter(isCampaignFinished).length
  }), [campaigns]);

  const filteredCampaigns = useMemo(() => {
    let list = campaigns;
    if (campaignFilter === 'activas') {
      list = list.filter(isCampaignActive);
    } else if (campaignFilter === 'inactivas') {
      list = list.filter(isCampaignInactive);
    } else if (campaignFilter === 'terminadas') {
      list = list.filter(isCampaignFinished);
    }

    if (campaignSearch.trim()) {
      const q = campaignSearch.toLowerCase().trim();
      list = list.filter(c => (c.titulo || '').toLowerCase().includes(q) || (c.descripcion || '').toLowerCase().includes(q));
    }
    return list;
  }, [campaigns, campaignFilter, campaignSearch]);

  const getCampaignEmptyMessage = () => {
    if (campaignSearch.trim()) {
      return `No se encontraron campañas que coincidan con "${campaignSearch}" en esta vista.`;
    }
    switch (campaignFilter) {
      case 'activas':
        return 'No hay campañas activas en este momento.';
      case 'inactivas':
        return 'No hay campañas inactivas registradas.';
      case 'terminadas':
        return 'No hay campañas terminadas (con meta 100% alcanzada).';
      default:
        return 'No hay campañas registradas.';
    }
  };

  return (
    <div className="flex-grow bg-slate-50 min-h-screen pt-28">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <AdminHeader
          activeTab={activeTab}
          setActiveTab={(tabId) => {
            setActiveTab(tabId);
            setShowCampaignForm(false);
            setShowNewsForm(false);
          }}
          partnersCount={partners.length}
          campaignsCount={campaigns.length}
          transfersCount={transfers.length}
          cuotasCount={cuotas.length}
          loading={loading}
        />

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
                <AdminModal
                  isOpen={showCampaignForm}
                  onClose={resetCampaignForm}
                  maxWidth="max-w-2xl"
                >
                  <CampaignForm
                    campaign={campaigns.find((c) => c.id === editingCampaignId)}
                    onSave={handleSaveCampaign}
                    onCancel={resetCampaignForm}
                    submitting={submitting}
                  />
                </AdminModal>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-brand-600" />
                        Gestión de Campañas
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Administre las iniciativas activas, pausadas y obras completadas.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-64">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar por título o descripción..."
                          maxLength={100}
                          value={campaignSearch}
                          onChange={(e) => setCampaignSearch(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs w-full font-semibold text-slate-700"
                        />
                      </div>
                      <button
                        onClick={() => {
                          resetCampaignForm();
                          setShowCampaignForm(true);
                        }}
                        disabled={submitting}
                        className="btn-brand py-2 px-4 text-xs disabled:opacity-40 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Nueva
                      </button>
                    </div>
                  </div>

                  {/* Tabs / Vistas de Campañas */}
                  <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCampaignFilter('todas')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        campaignFilter === 'todas'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      <span>Todas</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                          campaignFilter === 'todas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {campaignCounts.todas}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCampaignFilter('activas')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        campaignFilter === 'activas'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            campaignFilter === 'activas' ? 'bg-white' : 'bg-emerald-500'
                          }`}
                        />
                        Activas
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                          campaignFilter === 'activas' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {campaignCounts.activas}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCampaignFilter('inactivas')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        campaignFilter === 'inactivas'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200/80'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            campaignFilter === 'inactivas' ? 'bg-white' : 'bg-rose-500'
                          }`}
                        />
                        Inactivas
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                          campaignFilter === 'inactivas' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {campaignCounts.inactivas}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCampaignFilter('terminadas')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        campaignFilter === 'terminadas'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200/80'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            campaignFilter === 'terminadas' ? 'bg-white' : 'bg-indigo-500'
                          }`}
                        />
                        Terminadas
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                          campaignFilter === 'terminadas' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {campaignCounts.terminadas}
                      </span>
                    </button>
                  </div>

                  {filteredCampaigns.length === 0 ? (
                    <div className="p-12 text-center">
                      <Target className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-semibold">
                        {getCampaignEmptyMessage()}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredCampaigns.map((camp) => {
                        const isFinished = isCampaignFinished(camp);
                        return (
                          <div
                            key={camp.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-slate-50 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    isFinished
                                      ? 'bg-indigo-500'
                                      : camp.activo
                                      ? 'bg-emerald-500'
                                      : 'bg-slate-300'
                                  }`}
                                />
                                <h3 className="font-bold text-slate-800 text-sm">{camp.titulo}</h3>
                                {isFinished ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-indigo-600" />
                                    Terminada (100%)
                                  </span>
                                ) : !camp.activo ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    Inactiva
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Activa
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{camp.descripcion}</p>
                              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">
                                <span>
                                  Recaudado: ${parseFloat(camp.monto_actual).toLocaleString('es-AR')}
                                </span>
                                <span>
                                  Objetivo: ${parseFloat(camp.monto_objetivo).toLocaleString('es-AR')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleToggleCampaignActive(camp)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-colors ${
                                  camp.activo
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {camp.activo ? 'Desactivar' : 'Activar'}
                              </button>
                              <button
                                onClick={() => startEditCampaign(camp)}
                                className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-colors"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(camp.id)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
              <AdminPartnersTab
                partners={partners}
                loading={loading}
                submitting={submitting}
                onUpdatePartnerStatus={handleUpdatePartnerStatus}
                onSavePartnerDetails={handleSavePartnerDetails}
                onDeletePartner={handleDeletePartner}
              />
            )}

            {/* ══════════════ NEWS TAB ══════════════ */}
            {activeTab === 'news' && (
              <div className="space-y-5">
                <AdminModal
                  isOpen={showNewsForm}
                  onClose={resetNewsForm}
                  maxWidth="max-w-2xl"
                >
                  <NewsForm
                    newsItem={news.find((n) => n._id === editingNewsId)}
                    onSave={handleSaveNews}
                    onCancel={resetNewsForm}
                    submitting={submitting}
                  />
                </AdminModal>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                      <Newspaper className="h-5 w-5 text-accent-600" />
                      Publicaciones y Novedades
                    </h2>
                    <button
                      onClick={() => {
                        resetNewsForm();
                        setShowNewsForm(true);
                      }}
                      disabled={submitting}
                      className="btn-accent py-2 px-4 text-xs disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nueva Noticia
                    </button>
                  </div>

                  {news.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm font-semibold">
                      No hay noticias publicadas.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {news.map((item) => (
                        <div
                          key={item._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="space-y-1">
                            <h3 className="font-bold text-slate-800 text-sm">{item.titulo}</h3>
                            <p className="text-xs text-slate-400">
                              {new Date(item.fecha).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => startEditNews(item)}
                              className="p-2 text-slate-500 hover:text-accent-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNews(item._id)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
              <AdminTransfersTab
                transfers={transfers}
                loading={loading}
                submitting={submitting}
                onApprove={handleApproveTransfer}
                onReject={handleRejectTransfer}
              />
            )}

            {/* ══════════════ CUOTAS TAB ══════════════ */}
            {activeTab === 'cuotas' && (
              <AdminCuotasTab
                cuotas={cuotas}
                loading={loading}
                submitting={submitting}
                onValidateCuota={handleValidateCuota}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
