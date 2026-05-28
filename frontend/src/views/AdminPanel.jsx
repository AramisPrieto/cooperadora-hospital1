import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Shield, Users, Target, Plus, Pencil, Trash, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  
  // Estados de formularios para Campañas
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  
  // Campos del formulario
  const [titulo, setTitulo] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [montoActual, setMontoActual] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  
  // NoSQL Fields for Rich Details
  const [testimoniosText, setTestimoniosText] = useState('');
  const [testimoniosAutor, setTestimoniosAutor] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [obraStatus, setObraStatus] = useState('Planeada');

  // Estados de formularios para Noticias
  const [news, setNews] = useState([]);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState(null);

  // Campos del formulario de noticias
  const [newsTitulo, setNewsTitulo] = useState('');
  const [newsCuerpoHtml, setNewsCuerpoHtml] = useState('');
  const [newsTags, setNewsTags] = useState('');
  const [newsFecha, setNewsFecha] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Redirigir si no es admin
  useEffect(() => {
    if (!user || user.rol !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Cargar socios y campañas
  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [partnersRes, campaignsRes, newsRes] = await Promise.all([
        api.get('/socios'),
        api.get('/campanas'),
        api.get('/noticias')
      ]);
      setPartners(partnersRes.data);
      setCampaigns(campaignsRes.data);
      setNews(newsRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar la información del panel administrativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Aprobar un socio (Cambiar estado a activo)
  const handleApprovePartner = async (numeroAsociado) => {
    setSubmitting(true);
    try {
      await api.put(`/socios/${numeroAsociado}`, { estado: 'activo' });
      setSuccessMsg('Estado de socio actualizado a Activo.');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cambiar el estado del socio.');
    } finally {
      setSubmitting(false);
    }
  };

  // Crear o actualizar Campaña (Híbrida SQL + NoSQL)
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Estructurar NoSQL details payload
    const testimonios = (testimoniosText && testimoniosAutor) 
      ? [{ autor: testimoniosAutor, texto: testimoniosText }] 
      : [];
    const galeria_rica = imagenUrl 
      ? { imagenes: [imagenUrl], videos: [] } 
      : { imagenes: [], videos: [] };

    const payload = {
      titulo,
      monto_objetivo: parseFloat(montoObjetivo),
      monto_actual: montoActual ? parseFloat(montoActual) : 0,
      fecha_limite: fechaLimite || null,
      testimonios,
      galeria_rica,
      obra_status: obraStatus
    };

    try {
      if (editingCampaignId) {
        // Actualizar campaña
        await api.put(`/campanas/${editingCampaignId}`, payload);
        setSuccessMsg('Campaña híbrida actualizada correctamente.');
      } else {
        // Crear nueva campaña
        await api.post('/campanas', payload);
        setSuccessMsg('Campaña híbrida creada exitosamente en SQL y NoSQL.');
      }

      // Resetear formulario
      setShowCampaignForm(false);
      setEditingCampaignId(null);
      setTitulo('');
      setMontoObjetivo('');
      setMontoActual('');
      setFechaLimite('');
      setTestimoniosText('');
      setTestimoniosAutor('');
      setImagenUrl('');
      setObraStatus('Planeada');
      
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al guardar la campaña híbrida.');
    }
  };

  // Disparar edición de campaña
  const handleEditCampaign = async (id) => {
    setErrorMsg('');
    try {
      const res = await api.get(`/campanas/${id}`); // Data mashup
      const data = res.data;
      
      setEditingCampaignId(data.id);
      setTitulo(data.titulo);
      setMontoObjetivo(data.monto_objetivo);
      setMontoActual(data.monto_actual);
      setFechaLimite(data.fecha_limite ? data.fecha_limite.split('T')[0] : '');
      
      // NoSQL data details
      if (data.detalles.testimonios?.length > 0) {
        setTestimoniosText(data.detalles.testimonios[0].texto);
        setTestimoniosAutor(data.detalles.testimonios[0].autor);
      } else {
        setTestimoniosText('');
        setTestimoniosAutor('');
      }
      if (data.detalles.galeria_rica.imagenes?.length > 0) {
        setImagenUrl(data.detalles.galeria_rica.imagenes[0]);
      } else {
        setImagenUrl('');
      }
      setObraStatus(data.detalles.obra_status || 'Planeada');
      
      setShowCampaignForm(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron recuperar los detalles de la campaña.');
    }
  };

  // Eliminar campaña
  const handleDeleteCampaign = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta campaña y todos sus registros híbridos (SQL + NoSQL)?')) return;
    setSubmitting(true);
    try {
      await api.delete(`/campanas/${id}`);
      setSuccessMsg('Campaña eliminada correctamente de ambas bases de datos.');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al intentar eliminar la campaña.');
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir formulario para editar una noticia existente
  const handleEditNews = (noticia) => {
    setEditingNewsId(noticia._id);
    setNewsTitulo(noticia.titulo);
    setNewsCuerpoHtml(noticia.cuerpo_html);
    setNewsTags(noticia.tags ? noticia.tags.join(', ') : '');
    setNewsFecha(noticia.fecha ? noticia.fecha.split('T')[0] : '');
    setShowNewsForm(true);
    setErrorMsg('');
  };

  // Crear o actualizar una noticia (NoSQL - MongoDB)
  const handleSaveNews = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      titulo: newsTitulo,
      cuerpo_html: newsCuerpoHtml,
      tags: newsTags ? newsTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      fecha: newsFecha || undefined
    };

    try {
      if (editingNewsId) {
        await api.put(`/noticias/${editingNewsId}`, payload);
        setSuccessMsg('Noticia actualizada correctamente.');
      } else {
        await api.post('/noticias', payload);
        setSuccessMsg('Noticia publicada correctamente en MongoDB.');
      }

      setShowNewsForm(false);
      setEditingNewsId(null);
      setNewsTitulo('');
      setNewsCuerpoHtml('');
      setNewsTags('');
      setNewsFecha('');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Error al guardar la noticia.');
    }
  };

  // Eliminar una noticia
  const handleDeleteNews = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta noticia permanentemente?')) return;
    setSubmitting(true);
    try {
      await api.delete(`/noticias/${id}`);
      setSuccessMsg('Noticia eliminada correctamente.');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al eliminar la noticia.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-grow bg-slate-50 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Dashboard Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-950 rounded-3xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 bg-teal-500/10 rounded-full filter blur-[40px]"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-tight">Panel Administrativo</h1>
              <p className="text-xs text-slate-300 font-light mt-0.5">Controlador maestro de bases de datos híbridas y asociados.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-300 bg-slate-800/80 px-4 py-2.5 border border-slate-700/60 rounded-xl">
            <span>Operador: {user?.email}</span>
          </div>
        </div>

        {/* Global Warnings / Success alerts */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold">
            <CheckCircle className="h-5 w-5 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Formulario de Campañas */}
        {showCampaignForm && (
          <form onSubmit={handleSaveCampaign} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800">
                {editingCampaignId ? 'Editar Campaña Híbrida' : 'Registrar Nueva Campaña Híbrida'}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowCampaignForm(false); setEditingCampaignId(null); }}
                className="text-xs uppercase font-bold text-slate-400 hover:text-slate-600 tracking-wider"
              >
                Cancelar
              </button>
            </div>

            {/* Grid 1: SQL Data Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Título de Campaña (SQL/NoSQL)</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Monto Objetivo en Pesos (SQL)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={montoObjetivo}
                  onChange={(e) => setMontoObjetivo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Monto Actual Recaudado (SQL)</label>
                <input
                  type="number"
                  min="0"
                  value={montoActual}
                  onChange={(e) => setMontoActual(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Límite (SQL)</label>
                <input
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Obra (NoSQL - MongoDB)</label>
                <select
                  value={obraStatus}
                  onChange={(e) => setObraStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Planeada">Planeada</option>
                  <option value="En Ejecución">En Ejecución</option>
                  <option value="Finalizada">Finalizada</option>
                  <option value="Suspendida">Suspendida</option>
                </select>
              </div>
            </div>

            {/* Grid 2: MongoDB NoSQL Details (Testimonios & multimedia) */}
            <div className="bg-teal-50/20 border border-teal-500/10 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-teal-800 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Detalles Narrativos Multimedia (NoSQL - MongoDB)
              </h4>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Testimonio (Texto)</label>
                  <input
                    type="text"
                    value={testimoniosText}
                    onChange={(e) => setTestimoniosText(e.target.value)}
                    placeholder="Hermoso esfuerzo para el hospital..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Testimonio (Autor)</label>
                  <input
                    type="text"
                    value={testimoniosAutor}
                    onChange={(e) => setTestimoniosAutor(e.target.value)}
                    placeholder="Dr. Juan Gómez"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enlace de Imagen Enriquecida / Banner (Galería)</label>
                  <input
                    type="text"
                    value={imagenUrl}
                    onChange={(e) => setImagenUrl(e.target.value)}
                    placeholder="https://imagenes.hospital/campana-foto.jpg"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs uppercase font-bold tracking-wider shadow-lg shadow-teal-900/10"
            >
              {editingCampaignId ? 'Guardar Cambios Híbridos' : 'Crear Campaña en SQL + NoSQL'}
            </button>
          </form>
        )}

        {/* Formulario de Noticias */}
        {showNewsForm && (
          <form onSubmit={handleSaveNews} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800">
                {editingNewsId ? 'Editar Noticia' : 'Publicar Nueva Noticia'}
              </h3>
              <button
                type="button"
                onClick={() => { setShowNewsForm(false); setEditingNewsId(null); }}
                className="text-xs uppercase font-bold text-slate-400 hover:text-slate-600 tracking-wider"
              >
                Cancelar
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Título</label>
                <input
                  type="text"
                  required
                  value={newsTitulo}
                  onChange={(e) => setNewsTitulo(e.target.value)}
                  placeholder="Ej: Nuevo equipamiento para el área de maternidad"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cuerpo / Contenido <span className="normal-case text-slate-400 font-normal">(HTML permitido)</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={newsCuerpoHtml}
                  onChange={(e) => setNewsCuerpoHtml(e.target.value)}
                  placeholder="<p>Texto de la noticia...</p>"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono resize-y"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tags <span className="normal-case text-slate-400 font-normal">(separados por coma)</span>
                  </label>
                  <input
                    type="text"
                    value={newsTags}
                    onChange={(e) => setNewsTags(e.target.value)}
                    placeholder="equipamiento, pediatría, donación"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha de Publicación</label>
                  <input
                    type="date"
                    value={newsFecha}
                    onChange={(e) => setNewsFecha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs uppercase font-bold tracking-wider shadow-lg shadow-teal-900/10"
            >
              {editingNewsId ? 'Guardar Cambios' : 'Publicar Noticia en MongoDB'}
            </button>
          </form>
        )}

        {/* Dashboard Sections grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Listado de Campañas (Admin Column) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/60 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-600" />
                Gestión de Campañas
              </h2>
              <button
                onClick={() => {
                  setEditingCampaignId(null);
                  setTitulo('');
                  setMontoObjetivo('');
                  setMontoActual('');
                  setFechaLimite('');
                  setTestimoniosText('');
                  setTestimoniosAutor('');
                  setImagenUrl('');
                  setObraStatus('Planeada');
                  setShowCampaignForm(true);
                }}
                className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva
              </button>
            </div>

            {loading ? (
              <p className="text-center py-6 text-slate-400 text-xs">Cargando campañas...</p>
            ) : campaigns.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">No hay campañas.</p>
            ) : (
              <div className="space-y-4">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{camp.titulo}</h4>
                      <div className="flex gap-2 text-[10px] font-bold uppercase text-slate-400 mt-1">
                        <span>Meta: ${parseFloat(camp.monto_objetivo).toLocaleString('es-AR')}</span>
                        <span>•</span>
                        <span className="text-emerald-600">Recaudado: ${parseFloat(camp.monto_actual).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCampaign(camp.id)}
                        disabled={submitting}
                        className="p-2 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Editar con Data Mashup"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCampaign(camp.id)}
                        disabled={submitting}
                        className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Eliminar Híbrido"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listado de Socios (Admin Column) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/60 p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Users className="h-5 w-5 text-teal-600" />
              Libro Registro de Asociados
            </h2>

            {loading ? (
              <p className="text-center py-6 text-slate-400 text-xs">Cargando socios...</p>
            ) : partners.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">No hay perfiles de socios registrados.</p>
            ) : (
              <div className="space-y-4">
                {partners.map((part) => (
                  <div key={part.numero_asociado} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-800">Socio N° {part.numero_asociado}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">DNI: {part.dni} | {part.usuario?.email}</div>
                    </div>

                    {part.estado === 'pendiente' ? (
                      <button
                        onClick={() => handleApprovePartner(part.numero_asociado)}
                        disabled={submitting}
                        className="flex items-center gap-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Aprobar Socio físicamente"
                      >
                        <Clock className="h-3 w-3" />
                        Pendiente
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                        <CheckCircle className="h-3 w-3" />
                        Activo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sección de Noticias (ancho completo) */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Gestión de Noticias e Impacto Social
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">NoSQL</span>
            </h2>
            <button
              onClick={() => {
                setEditingNewsId(null);
                setNewsTitulo('');
                setNewsCuerpoHtml('');
                setNewsTags('');
                setNewsFecha('');
                setShowNewsForm(true);
              }}
              className="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </button>
          </div>

          {loading ? (
            <p className="text-center py-6 text-slate-400 text-xs">Cargando noticias...</p>
          ) : news.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-xs">No hay noticias publicadas.</p>
          ) : (
            <div className="space-y-3">
              {news.map((noticia) => (
                <div key={noticia._id} className="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors gap-4">
                  <div className="flex-grow min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{noticia.titulo}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {new Date(noticia.fecha).toLocaleDateString('es-AR')}
                      </span>
                      {noticia.tags?.map((tag, i) => (
                        <span key={i} className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditNews(noticia)}
                      disabled={submitting}
                      className="p-2 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Editar noticia"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNews(noticia._id)}
                      disabled={submitting}
                      className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Eliminar noticia"
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
    </div>
  );
};

export default AdminPanel;
