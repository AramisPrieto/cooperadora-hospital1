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

  const [loading, setLoading] = useState(true);
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
      const [partnersRes, campaignsRes] = await Promise.all([
        api.get('/socios'),
        api.get('/campanas')
      ]);
      setPartners(partnersRes.data);
      setCampaigns(campaignsRes.data);
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
    try {
      await api.put(`/socios/${numeroAsociado}`, { estado: 'activo' });
      setSuccessMsg('Estado de socio actualizado a Activo.');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cambiar el estado del socio.');
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
    try {
      await api.delete(`/campanas/${id}`);
      setSuccessMsg('Campaña eliminada correctamente de ambas bases de datos.');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al intentar eliminar la campaña.');
    }
  };

  return (
    <div class="flex-grow bg-slate-50 py-10 px-4">
      <div class="max-w-7xl mx-auto space-y-8">
        
        {/* Header Dashboard Banner */}
        <div class="bg-gradient-to-r from-slate-900 to-teal-950 rounded-3xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div class="absolute -top-10 -right-10 h-40 w-40 bg-teal-500/10 rounded-full filter blur-[40px]"></div>
          <div class="flex items-center gap-4 relative z-10">
            <div class="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield class="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h1 class="text-2xl font-black tracking-tight leading-tight">Panel Administrativo</h1>
              <p class="text-xs text-slate-300 font-light mt-0.5">Controlador maestro de bases de datos híbridas y asociados.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-300 bg-slate-800/80 px-4 py-2.5 border border-slate-700/60 rounded-xl">
            <span>Operador: {user?.email}</span>
          </div>
        </div>

        {/* Global Warnings / Success alerts */}
        {errorMsg && (
          <div class="flex items-center gap-2 p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-bold">
            <AlertTriangle class="h-5 w-5 shrink-0" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div class="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold">
            <CheckCircle class="h-5 w-5 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Formulario de Campañas */}
        {showCampaignForm && (
          <form onSubmit={handleSaveCampaign} class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div class="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 class="text-lg font-black text-slate-800">
                {editingCampaignId ? 'Editar Campaña Híbrida' : 'Registrar Nueva Campaña Híbrida'}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowCampaignForm(false); setEditingCampaignId(null); }}
                class="text-xs uppercase font-bold text-slate-400 hover:text-slate-600 tracking-wider"
              >
                Cancelar
              </button>
            </div>

            {/* Grid 1: SQL Data Fields */}
            <div class="grid md:grid-cols-2 gap-4">
              <div class="space-y-1.5 md:col-span-2">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Título de Campaña (SQL/NoSQL)</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Monto Objetivo en Pesos (SQL)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={montoObjetivo}
                  onChange={(e) => setMontoObjetivo(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Monto Actual Recaudado (SQL)</label>
                <input
                  type="number"
                  min="0"
                  value={montoActual}
                  onChange={(e) => setMontoActual(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Límite (SQL)</label>
                <input
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Obra (NoSQL - MongoDB)</label>
                <select
                  value={obraStatus}
                  onChange={(e) => setObraStatus(e.target.value)}
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Planeada">Planeada</option>
                  <option value="En Ejecución">En Ejecución</option>
                  <option value="Finalizada">Finalizada</option>
                  <option value="Suspendida">Suspendida</option>
                </select>
              </div>
            </div>

            {/* Grid 2: MongoDB NoSQL Details (Testimonios & multimedia) */}
            <div class="bg-teal-50/20 border border-teal-500/10 rounded-2xl p-5 space-y-4">
              <h4 class="text-xs font-bold text-teal-800 uppercase tracking-widest flex items-center gap-1.5">
                <FileText class="h-4 w-4" />
                Detalles Narrativos Multimedia (NoSQL - MongoDB)
              </h4>

              <div class="grid md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Testimonio (Texto)</label>
                  <input
                    type="text"
                    value={testimoniosText}
                    onChange={(e) => setTestimoniosText(e.target.value)}
                    placeholder="Hermoso esfuerzo para el hospital..."
                    class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Testimonio (Autor)</label>
                  <input
                    type="text"
                    value={testimoniosAutor}
                    onChange={(e) => setTestimoniosAutor(e.target.value)}
                    placeholder="Dr. Juan Gómez"
                    class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  />
                </div>

                <div class="space-y-1.5 md:col-span-2">
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enlace de Imagen Enriquecida / Banner (Galería)</label>
                  <input
                    type="text"
                    value={imagenUrl}
                    onChange={(e) => setImagenUrl(e.target.value)}
                    placeholder="https://imagenes.hospital/campana-foto.jpg"
                    class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              class="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs uppercase font-bold tracking-wider shadow-lg shadow-teal-900/10"
            >
              {editingCampaignId ? 'Guardar Cambios Híbridos' : 'Crear Campaña en SQL + NoSQL'}
            </button>
          </form>
        )}

        {/* Dashboard Sections grid */}
        <div class="grid lg:grid-cols-12 gap-8">
          
          {/* Listado de Campañas (Admin Column) */}
          <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200/60 p-6 space-y-6 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
                <Target class="h-5 w-5 text-teal-600" />
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
                class="flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Plus class="h-3.5 w-3.5" />
                Nueva
              </button>
            </div>

            {loading ? (
              <p class="text-center py-6 text-slate-400 text-xs">Cargando campañas...</p>
            ) : campaigns.length === 0 ? (
              <p class="text-center py-6 text-slate-400 text-xs">No hay campañas.</p>
            ) : (
              <div class="space-y-4">
                {campaigns.map((camp) => (
                  <div key={camp.id} class="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors">
                    <div>
                      <h4 class="text-sm font-bold text-slate-800 line-clamp-1">{camp.titulo}</h4>
                      <div class="flex gap-2 text-[10px] font-bold uppercase text-slate-400 mt-1">
                        <span>Meta: ${parseFloat(camp.monto_objetivo).toLocaleString('es-AR')}</span>
                        <span>•</span>
                        <span class="text-emerald-600">Recaudado: ${parseFloat(camp.monto_actual).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditCampaign(camp.id)}
                        class="p-2 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors text-slate-400"
                        title="Editar con Data Mashup"
                      >
                        <Pencil class="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCampaign(camp.id)}
                        class="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-slate-400"
                        title="Eliminar Híbrido"
                      >
                        <Trash class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listado de Socios (Admin Column) */}
          <div class="lg:col-span-5 bg-white rounded-3xl border border-slate-200/60 p-6 space-y-6 shadow-sm">
            <h2 class="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Users class="h-5 w-5 text-teal-600" />
              Libro Registro de Asociados
            </h2>

            {loading ? (
              <p class="text-center py-6 text-slate-400 text-xs">Cargando socios...</p>
            ) : partners.length === 0 ? (
              <p class="text-center py-6 text-slate-400 text-xs">No hay perfiles de socios registrados.</p>
            ) : (
              <div class="space-y-4">
                {partners.map((part) => (
                  <div key={part.numero_asociado} class="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <div class="text-xs font-extrabold text-slate-800">Socio N° {part.numero_asociado}</div>
                      <div class="text-[10px] text-slate-400 font-semibold mt-0.5">DNI: {part.dni} | {part.usuario?.email}</div>
                    </div>

                    {part.estado === 'pendiente' ? (
                      <button
                        onClick={() => handleApprovePartner(part.numero_asociado)}
                        class="flex items-center gap-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                        title="Aprobar Socio físicamente"
                      >
                        <Clock class="h-3 w-3" />
                        Pendiente
                      </button>
                    ) : (
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                        <CheckCircle class="h-3 w-3" />
                        Activo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminPanel;
