import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList
} from 'recharts';
import {
  Shield, Users, Target, Plus, Pencil, Trash, FileText,
  CheckCircle, Clock, AlertTriangle, LayoutDashboard,
  Newspaper, TrendingUp, X, Save, AlertCircle, Sparkles,
  Banknote, XCircle, ChevronDown, ChevronUp, User, MapPin,
  Calendar, Globe, Phone, Info
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
  { id: 'transfers', label: 'Transferencias', icon: Banknote }, // TEAM_001: Nueva pestaña
];

/* ── Mock Data para Gráficos ── */
const mockRevenueData = [
  { name: 'Ene', ingresos: 400000 },
  { name: 'Feb', ingresos: 300000 },
  { name: 'Mar', ingresos: 550000 },
  { name: 'Abr', ingresos: 450000 },
  { name: 'May', ingresos: 800000 },
  { name: 'Jun', ingresos: 1200000 },
];

const mockPartnersData = [
  { name: 'Ene', nuevos: 12 },
  { name: 'Feb', nuevos: 18 },
  { name: 'Mar', nuevos: 25 },
  { name: 'Abr', nuevos: 20 },
  { name: 'May', nuevos: 40 },
  { name: 'Jun', nuevos: 65 },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [partners, setPartners] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [news, setNews] = useState([]);
  const [transfers, setTransfers] = useState([]); // TEAM_001: Estado para transferencias
  const [expandedPartnerId, setExpandedPartnerId] = useState(null);
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    apellido: '',
    direccion: '',
    localidad: '',
    nacionalidad: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: '',
    metodo_pago: '',
    fecha_ultimo_pago: '',
    observaciones: ''
  });


  /* Campaign form */
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [montoActual, setMontoActual] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [testimoniosText, setTestimoniosText] = useState('');
  const [testimoniosAutor, setTestimoniosAutor] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [obraStatus, setObraStatus] = useState('Planeada');
  const [esCampanaDelMes, setEsCampanaDelMes] = useState(false);

  /* News form */
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [newsTitulo, setNewsTitulo] = useState('');
  const [newsCuerpoHtml, setNewsCuerpoHtml] = useState('');
  const [newsTags, setNewsTags] = useState('');
  const [newsFecha, setNewsFecha] = useState('');

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
      const [pRes, cRes, nRes, tRes] = await Promise.all([
        api.get('/socios'),
        api.get('/campanas'),
        api.get('/noticias'),
        api.get('/donaciones/transferencias') // TEAM_001: Petición a la API de transferencias
      ]);
      setPartners(pRes.data);
      setCampaigns(cRes.data);
      setNews(nRes.data);
      setTransfers(tRes.data); // TEAM_001: Actualizar estado de transferencias
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar la información del panel.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Socio editing handlers ── */
  const startEditPartner = (part) => {
    setEditingPartnerId(part.numero_asociado);
    setEditForm({
      nombre: part.nombre || '',
      apellido: part.apellido || '',
      direccion: part.direccion || '',
      localidad: part.localidad || '',
      nacionalidad: part.nacionalidad || '',
      telefono: part.telefono || '',
      fecha_nacimiento: part.fecha_nacimiento || '',
      genero: part.genero || '',
      metodo_pago: part.metodo_pago || '',
      fecha_ultimo_pago: part.fecha_ultimo_pago || '',
      observaciones: part.observaciones || ''
    });
  };

  const handleSavePartnerDetails = async (id) => {
    // Validar campos requeridos antes de guardar
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
    } = editForm;

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
      await api.put(`/socios/${id}`, editForm);
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

  /* ── Approve partner ── */
  const handleApprovePartner = async (num) => {
    setSubmitting(true);
    try {
      await api.put(`/socios/${num}`, { estado: 'activo' });
      setSuccessMsg('Socio aprobado y activo en el Libro Registro.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg('Error al actualizar el estado del socio.');
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
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');
    const testimonios = (testimoniosText && testimoniosAutor)
      ? [{ autor: testimoniosAutor, texto: testimoniosText }]
      : [];
    const galeria_rica = imagenUrl
      ? { imagenes: [imagenUrl], videos: [] }
      : { imagenes: [], videos: [] };
    const payload = {
      titulo, monto_objetivo: parseFloat(montoObjetivo),
      monto_actual: montoActual ? parseFloat(montoActual) : 0,
      fecha_limite: fechaLimite || null,
      es_campana_del_mes: esCampanaDelMes,
      testimonios, galeria_rica, obra_status: obraStatus,
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
    setTitulo(''); setMontoObjetivo(''); setMontoActual('');
    setFechaLimite(''); setTestimoniosText('');
    setTestimoniosAutor(''); setImagenUrl(''); setObraStatus('Planeada');
    setEsCampanaDelMes(false);
  };

  const handleEditCampaign = async (id) => {
    setErrorMsg('');
    try {
      const res = await api.get(`/campanas/${id}`);
      const d = res.data;
      setEditingCampaignId(d.id); setTitulo(d.titulo);
      setMontoObjetivo(d.monto_objetivo); setMontoActual(d.monto_actual);
      setFechaLimite(d.fecha_limite ? d.fecha_limite.split('T')[0] : '');
      setTestimoniosText(d.detalles.testimonios?.[0]?.texto ?? '');
      setTestimoniosAutor(d.detalles.testimonios?.[0]?.autor ?? '');
      setImagenUrl(d.detalles.galeria_rica.imagenes?.[0] ?? '');
      setObraStatus(d.detalles.obra_status ?? 'Planeada');
      setEsCampanaDelMes(d.es_campana_del_mes ?? false);
      setShowCampaignForm(true);
    } catch (err) {
      setErrorMsg('No se pudieron recuperar los detalles de la campaña.');
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!confirm('¿Seguro que desea eliminar esta campaña y todo su contenido asociado?')) return;
    setSubmitting(true);
    try {
      await api.delete(`/campanas/${id}`);
      setSuccessMsg('Campaña eliminada de ambas bases de datos.');
      loadDashboardData();
    } catch (err) {
      setErrorMsg('Error al eliminar la campaña.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Save news ── */
  const handleSaveNews = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg('');
    const payload = {
      titulo: newsTitulo, cuerpo_html: newsCuerpoHtml,
      tags: [],
      fecha: newsFecha || undefined,
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
    setNewsTitulo(''); setNewsCuerpoHtml(''); setNewsTags(''); setNewsFecha('');
  };

  const handleEditNews = (n) => {
    setEditingNewsId(n._id); setNewsTitulo(n.titulo);
    setNewsCuerpoHtml(n.cuerpo_html);
    setNewsTags(n.tags?.join(', ') ?? '');
    setNewsFecha(n.fecha ? n.fecha.split('T')[0] : '');
    setShowNewsForm(true); setErrorMsg('');
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
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Gráfico 1 */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Evolución de Recaudaciones (Mensual)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                          <Tooltip formatter={(value) => `$${value}`} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="ingresos" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Gráfico 2 */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Nuevos Socios Registrados</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockPartnersData} margin={{ top: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: '#fef2f2' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="nuevos" fill="#dc2626" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="nuevos" position="top" fill="#dc2626" fontSize={12} fontWeight="bold" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <p className="text-[11px] text-slate-400 text-center mt-4 font-semibold px-4 py-3 bg-slate-100/50 rounded-xl">
                  <AlertCircle className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                  Nota: Los gráficos muestran datos de muestra (mock data) de forma demostrativa hasta la integración del historial transaccional en el servidor.
                </p>
              </div>
            )}

            {/* ══════════════ CAMPAIGNS TAB ══════════════ */}
        {activeTab === 'campaigns' && (
          <div className="space-y-5">
            {/* Campaign Form */}
            {showCampaignForm && (
              <form onSubmit={handleSaveCampaign} className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-display font-black text-slate-800">
                    {editingCampaignId ? '✏️ Editar Campaña' : '+ Nueva Campaña Híbrida'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetCampaignForm}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* SQL fields */}
                <div>
                  <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <div className="h-0.5 w-5 bg-brand-400 rounded-full" />
                    Datos Generales
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FormLabel>Título de la Campaña</FormLabel>
                      <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)} className={inputCls} placeholder="Ej: Equipamiento para Pediatría" />
                    </div>
                    <div>
                      <FormLabel>Monto Objetivo (ARS)</FormLabel>
                      <input type="number" required min="0" value={montoObjetivo} onChange={e => setMontoObjetivo(e.target.value)} className={inputCls} placeholder="5000000" />
                    </div>
                    <div>
                      <FormLabel>Monto Actual Recaudado (ARS)</FormLabel>
                      <input type="number" min="0" value={montoActual} onChange={e => setMontoActual(e.target.value)} className={inputCls} placeholder="0" />
                    </div>
                    <div>
                      <FormLabel>Fecha Límite</FormLabel>
                      <input type="date" value={fechaLimite} onChange={e => setFechaLimite(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <FormLabel>Estado de Obra</FormLabel>
                      <select value={obraStatus} onChange={e => setObraStatus(e.target.value)} className={inputCls}>
                        <option value="Planeada">Planeada</option>
                        <option value="En Ejecución">En Ejecución</option>
                        <option value="En Proceso de Licitación">En Proceso de Licitación</option>
                        <option value="Finalizada">Finalizada</option>
                        <option value="Suspendida">Suspendida</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-center bg-slate-50 border border-slate-200/60 p-4 rounded-xl mt-2 select-none hover:bg-slate-100/50 transition-colors">
                      <input
                        type="checkbox"
                        id="esCampanaDelMes"
                        checked={esCampanaDelMes}
                        onChange={e => setEsCampanaDelMes(e.target.checked)}
                        className="h-4.5 w-4.5 text-brand-600 focus:ring-brand-500 border-slate-300 rounded cursor-pointer"
                      />
                      <label htmlFor="esCampanaDelMes" className="ml-3 block text-xs font-black text-slate-700 uppercase tracking-wider cursor-pointer">
                        ★ Destacar como Campaña Activa del Mes (Hero del Home)
                      </label>
                    </div>
                  </div>
                </div>

                {/* NoSQL fields */}
                <div className="bg-violet-50 border border-violet-200/50 rounded-2xl p-5 space-y-4">
                  <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Detalles Multimedia
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <FormLabel>Testimonio (Texto)</FormLabel>
                      <input type="text" value={testimoniosText} onChange={e => setTestimoniosText(e.target.value)} className={inputCls} placeholder="Fue un gran aporte para el hospital..." />
                    </div>
                    <div>
                      <FormLabel>Testimonio (Autor)</FormLabel>
                      <input type="text" value={testimoniosAutor} onChange={e => setTestimoniosAutor(e.target.value)} className={inputCls} placeholder="Dr. Juan Gómez" />
                    </div>
                    <div className="md:col-span-2">
                      <FormLabel>URL de Imagen (Galería)</FormLabel>
                      <input type="url" value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} className={inputCls} placeholder="https://imagenes.hospital/foto.jpg" />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-brand w-full py-3.5 shine">
                  <Save className="h-4 w-4" />
                  {editingCampaignId ? 'Guardar Cambios' : 'Crear Campaña'}
                </button>
              </form>
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
                            <div className="progress-fill h-full" style={{ width: `${pct}%` }} />
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
                            <button
                              onClick={() => handleApprovePartner(part.numero_asociado)}
                              disabled={submitting}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                            >
                              <Clock className="h-3 w-3" />
                              Aprobar
                            </button>
                          ) : part.estado === 'inactivo' ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-black uppercase tracking-wider">
                              <XCircle className="h-3 w-3" />
                              Inactivo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-wider">
                              <CheckCircle className="h-3 w-3" />
                              Activo
                            </span>
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
                            /* EDIT MODE FORM */
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs animate-fade-down">
                              {/* Col 1: Datos Personales */}
                              <div className="space-y-2.5">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <User className="h-3.5 w-3.5 text-brand-500" />
                                  Editar Datos Personales
                                </h4>
                                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre *</label>
                                    <input type="text" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} className="input-field py-1.5 px-3 text-xs" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Apellido *</label>
                                    <input type="text" value={editForm.apellido} onChange={e => setEditForm({ ...editForm, apellido: e.target.value })} className="input-field py-1.5 px-3 text-xs" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Nacimiento *</label>
                                    <input type="date" value={editForm.fecha_nacimiento} onChange={e => setEditForm({ ...editForm, fecha_nacimiento: e.target.value })} className="input-field py-1.5 px-3 text-xs" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Género *</label>
                                    <select value={editForm.genero} onChange={e => setEditForm({ ...editForm, genero: e.target.value })} className="input-field py-1.5 px-3 text-xs">
                                      <option value="">Seleccione...</option>
                                      <option value="masculino">Masculino</option>
                                      <option value="femenino">Femenino</option>
                                      <option value="otro">Otro</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nacionalidad *</label>
                                    <input type="text" value={editForm.nacionalidad} onChange={e => setEditForm({ ...editForm, nacionalidad: e.target.value })} className="input-field py-1.5 px-3 text-xs" />
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
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono *</label>
                                    <input type="text" value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} className="input-field py-1.5 px-3 text-xs" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dirección *</label>
                                    <input type="text" value={editForm.direccion} onChange={e => setEditForm({ ...editForm, direccion: e.target.value })} className="input-field py-1.5 px-3 text-xs" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Localidad *</label>
                                    <input type="text" value={editForm.localidad} onChange={e => setEditForm({ ...editForm, localidad: e.target.value })} className="input-field py-1.5 px-3 text-xs" />
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
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Método de Pago *</label>
                                    <select value={editForm.metodo_pago} onChange={e => setEditForm({ ...editForm, metodo_pago: e.target.value })} className="input-field py-1.5 px-3 text-xs">
                                      <option value="">Seleccione...</option>
                                      <option value="transferencia">Transferencia Bancaria</option>
                                      <option value="efectivo">Efectivo</option>
                                      <option value="cobrador">Cobrador a Domicilio</option>
                                      <option value="debito">Débito Automático</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Último Pago</label>
                                    <input type="date" value={editForm.fecha_ultimo_pago} onChange={e => setEditForm({ ...editForm, fecha_ultimo_pago: e.target.value })} className="input-field py-1.5 px-3 text-xs" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Observaciones</label>
                                    <textarea value={editForm.observaciones} onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })} rows={3} className="input-field py-1.5 px-3 text-xs resize-none" placeholder="Notas internas..." />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* DISPLAY MODE (Read-only) */
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
                          )}

                          {/* ACTION BUTTONS (At the bottom of the card) */}
                          <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-3">
                            {editingPartnerId === part.numero_asociado ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingPartnerId(null)}
                                  disabled={submitting}
                                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase tracking-wider rounded-xl text-[10px] transition-colors disabled:opacity-40 animate-fade"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSavePartnerDetails(part.numero_asociado)}
                                  disabled={submitting}
                                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold uppercase tracking-wider rounded-xl text-[10px] transition-colors disabled:opacity-40 animate-fade"
                                >
                                  Guardar Datos
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditPartner(part)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider rounded-xl text-[10px] transition-colors animate-fade"
                              >
                                Editar Datos
                              </button>
                            )}
                          </div>
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
              <form onSubmit={handleSaveNews} className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-display font-black text-slate-800">
                    {editingNewsId ? '✏️ Editar Noticia' : '+ Nueva Noticia'}
                  </h3>
                  <button type="button" onClick={resetNewsForm} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <FormLabel>Título</FormLabel>
                  <input type="text" required value={newsTitulo} onChange={e => setNewsTitulo(e.target.value)} className={inputCls} placeholder="Ej: Nuevo equipamiento para maternidad" />
                </div>
                <div>
                  <FormLabel>Cuerpo / Contenido <span className="normal-case text-slate-400 font-normal ml-1">(HTML permitido)</span></FormLabel>
                  <textarea
                    required rows={5} value={newsCuerpoHtml}
                    onChange={e => setNewsCuerpoHtml(e.target.value)}
                    placeholder="<p>Texto de la noticia...</p>"
                    className={`${inputCls} font-mono resize-y`}
                  />
                </div>
                <div>
                  <FormLabel>Fecha de Publicación</FormLabel>
                  <input type="date" value={newsFecha} onChange={e => setNewsFecha(e.target.value)} className={inputCls} />
                </div>

                <button type="submit" className="btn-brand w-full py-3.5 shine">
                  <Save className="h-4 w-4" />
                  {editingNewsId ? 'Guardar Cambios' : 'Publicar Noticia'}
                </button>
              </form>
            )}

            {/* News list */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-violet-600" />
                  Gestión de Noticias
                  <span className="badge bg-violet-100 text-violet-700 ml-1">Visible</span>
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
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600" />
                Donaciones por Transferencia Bancaria
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Gestione y apruebe las declaraciones de transferencia de los socios.</p>
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
                      <th className="p-4">Socio (Email)</th>
                      <th className="p-4">Campaña</th>
                      <th className="p-4 text-right">Monto</th>
                      <th className="p-4">Comprobante</th>
                      <th className="p-4">Fecha Reporte</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transfers.map(tr => (
                      <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-700">{tr.usuario?.email ?? '—'}</td>
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
