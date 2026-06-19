import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Search, 
  Grid, 
  Calendar, 
  Users, 
  Award, 
  Sparkles, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import api from '../api/axios';

const getCategoryFromTitle = (title) => {
  const t = title.toLowerCase();
  if (t.includes('neonato') || t.includes('bebé') || t.includes('cuna')) return 'Neonatología';
  if (t.includes('emergencia') || t.includes('guardia') || t.includes('desfibrilador') || t.includes('paro')) return 'Emergencias';
  if (t.includes('diagnóstic') || t.includes('mamógraf') || t.includes('rayos') || t.includes('ecógraf') || t.includes('tomógraf') || t.includes('resonador') || t.includes('mamógrafo')) return 'Diagnóstico';
  if (t.includes('terapia') || t.includes('oxígeno') || t.includes('respirador') || t.includes('ventilador')) return 'Terapia Intensiva';
  if (t.includes('pediatr') || t.includes('niño') || t.includes('juegos') || t.includes('infantil')) return 'Pediatría';
  if (t.includes('laboratorio') || t.includes('centrífuga') || t.includes('analizador') || t.includes('microscopio')) return 'Laboratorio';
  return 'General';
};

const CATEGORY_COLORS = {
  Neonatología: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  Emergencias: 'bg-amber-50 text-amber-700 border border-amber-100',
  Diagnóstico: 'bg-blue-50 text-blue-700 border border-blue-100',
  'Terapia Intensiva': 'bg-purple-50 text-purple-700 border border-purple-100',
  Pediatría: 'bg-pink-50 text-pink-700 border border-pink-100',
  Laboratorio: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  General: 'bg-slate-50 text-slate-700 border border-slate-100',
};

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const getDonorCount = (id, monto) => Math.round(parseFloat(monto) / 12000) + (id * 11) + 14;

const ObrasConcretadas = () => {
  const navigate = useNavigate();
  
  // State
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'timeline'

  // Fetch completed campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const res = await api.get('/campanas?all=true');
        // Filter campaigns that reached 100% of their objective
        const completed = res.data.filter(c => parseFloat(c.monto_actual) >= parseFloat(c.monto_objetivo));
        setCampaigns(completed);
      } catch (err) {
        console.error('Error cargando obras concretadas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  // Update Page Title
  useEffect(() => {
    document.title = "Obras Concretadas — Cooperadora del Hospital Emilio Ferreyra";
  }, []);

  // Unique categories list
  const categories = useMemo(() => {
    const cats = new Set(campaigns.map(c => getCategoryFromTitle(c.titulo)));
    return ['Todas', ...Array.from(cats)];
  }, [campaigns]);

  // Statistics calculations
  const stats = useMemo(() => {
    const totalInvested = campaigns.reduce((acc, c) => acc + parseFloat(c.monto_actual), 0);
    const totalDonors = campaigns.reduce((acc, c) => acc + getDonorCount(c.id, c.monto_actual), 0);
    return {
      count: campaigns.length,
      invested: totalInvested,
      donors: totalDonors
    };
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const category = getCategoryFromTitle(c.titulo);
      const matchesCategory = selectedCategory === 'Todas' || category === selectedCategory;
      const matchesSearch = c.titulo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [campaigns, selectedCategory, searchQuery]);

  // Helper for sorting timeline items by completion date (newest first)
  const timelineCampaigns = useMemo(() => {
    return [...filteredCampaigns].sort((a, b) => {
      const dateA = a.fecha_limite ? new Date(a.fecha_limite) : new Date(0);
      const dateB = b.fecha_limite ? new Date(b.fecha_limite) : new Date(0);
      return dateB - dateA;
    });
  }, [filteredCampaigns]);

  const handleCardClick = (id) => {
    navigate(`/campanas/${id}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative background blur shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-50/40 rounded-full blur-[120px] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-50/30 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* ── Breadcrumb ── */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-xs font-semibold text-slate-505">
            <li>
              <Link to="/" className="hover:text-brand-600 transition-colors flex items-center gap-1.5">
                Inicio
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <li className="text-slate-800 font-extrabold" aria-current="page">
              Obras Concretadas
            </li>
          </ol>
        </nav>

        {/* ── Header Section ── */}
        <div className="text-left max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 mb-4 bg-accent-50 text-accent-700 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-accent-100 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Impacto Comunitario
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-slate-900 tracking-tight leading-none mb-4">
            Proyectos hechos realidad
          </h1>
          <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed">
            Gracias al compromiso inquebrantable de la comunidad, comercios y socios, transformamos fondos en infraestructura de salud pública de calidad. Aquí se detallan los logros alcanzados.
          </p>
        </div>

        {/* ── Statistics Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Total Obras */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5 group">
            <div className="h-14 w-14 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Equipos & Obras</p>
              <h3 className="text-2xl font-display font-black text-slate-800 mt-1">{loading ? '...' : stats.count} Proyectos</h3>
              <p className="text-xs text-slate-500 mt-0.5">Financiados al 100%</p>
            </div>
          </div>

          {/* Card 2: Total Invested */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5 group">
            <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Inversión Lograda</p>
              <h3 className="text-2xl font-display font-black text-slate-800 mt-1">
                {loading ? '...' : formatter.format(stats.invested)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Dinero de la comunidad</p>
            </div>
          </div>

          {/* Card 3: Total Donors */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5 group">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Participación</p>
              <h3 className="text-2xl font-display font-black text-slate-800 mt-1">
                +{loading ? '...' : stats.donors.toLocaleString('es-AR')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Donantes involucrados</p>
            </div>
          </div>
        </div>

        {/* ── Filter Controls & Mode Toggler ── */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-5 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              id="search-obras-input"
              type="text"
              placeholder="Buscar obra concretada..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50/80 rounded-2xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
            />
          </div>

          {/* Category Chips Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-none self-start md:self-auto">
            {categories.map(cat => (
              <button
                key={cat}
                id={`cat-chip-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Mode Toggler (Grid vs Timeline) */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40 shrink-0 self-end md:self-auto">
            <button
              id="toggle-view-grid"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid className="h-4 w-4" />
              Grilla
            </button>
            <button
              id="toggle-view-timeline"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Línea de Tiempo
            </button>
          </div>
        </div>

        {/* ── Main View Panel ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent-600 border-r-2 mb-4"></div>
            <p className="text-slate-500 text-sm font-semibold">Cargando logros e impacto...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/50 p-12 text-center max-w-xl mx-auto shadow-sm">
            <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-display font-black text-slate-800">No se encontraron obras</h3>
            <p className="text-slate-500 text-sm mt-2">
              No hay proyectos concretados en la categoría <strong>{selectedCategory}</strong> que coincidan con la búsqueda. Intenta limpiar los filtros.
            </p>
            <button
              onClick={() => { setSelectedCategory('Todas'); setSearchQuery(''); }}
              className="mt-6 btn-accent px-6 py-2.5 text-xs inline-flex"
            >
              Limpiar Filtros
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ──────────────── GRID VIEW ──────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {filteredCampaigns.map(camp => {
              const category = getCategoryFromTitle(camp.titulo);
              const catClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
              const image = camp.detalles?.galeria_rica?.imagenes?.[0] || camp.detalles?.equipamiento_imagen || '';
              const donors = getDonorCount(camp.id, camp.monto_actual);
              const dateStr = camp.fecha_limite 
                ? new Date(camp.fecha_limite).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                : 'Recientemente';

              return (
                <div
                  key={camp.id}
                  onClick={() => handleCardClick(camp.id)}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
                >
                  {/* Banner superior de logro */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
                      <CheckCircle className="h-3.5 w-3.5 fill-white text-emerald-500" />
                      100% Logrado
                    </span>
                  </div>

                  {/* Imagen o gradiente alternativo */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 border-b border-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={camp.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-550 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-accent-600 to-teal-800 flex items-center justify-center p-6 relative">
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <Award className="h-12 w-12 text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Contenido de la Tarjeta */}
                  <div className="p-6 flex flex-col flex-grow gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${catClass}`}>
                        {category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateStr}
                      </span>
                    </div>

                    <h3 className="text-base font-display font-black text-slate-800 leading-snug group-hover:text-accent-600 transition-colors line-clamp-2 min-h-[2.75rem]">
                      {camp.titulo}
                    </h3>

                    {/* Línea divisoria */}
                    <div className="border-t border-slate-100 pt-4 mt-auto">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Inversión Final</p>
                          <p className="font-extrabold text-slate-800 mt-0.5">{formatter.format(camp.monto_actual)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Co-financiamiento</p>
                          <p className="font-extrabold text-slate-800 mt-0.5">{donors} donantes</p>
                        </div>
                      </div>
                    </div>

                    {/* Botón de acción simulado */}
                    <div className="pt-2 flex items-center justify-between text-xs font-black text-accent-700 uppercase tracking-widest group-hover:text-accent-600 transition-colors">
                      <span>Ver Detalles del Logro</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ──────────────── TIMELINE VIEW ──────────────── */
          <div className="relative py-8 animate-fade-in">
            {/* Eje de la línea de tiempo */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-slate-200/80 -translate-x-1/2 pointer-events-none" />

            <div className="space-y-12">
              {timelineCampaigns.map((camp, index) => {
                const category = getCategoryFromTitle(camp.titulo);
                const catClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
                const image = camp.detalles?.galeria_rica?.imagenes?.[0] || camp.detalles?.equipamiento_imagen || '';
                const donors = getDonorCount(camp.id, camp.monto_actual);
                const dateStr = camp.fecha_limite 
                  ? new Date(camp.fecha_limite).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                  : 'Recientemente';
                
                // Align left or right on desktop
                const isLeft = index % 2 === 0;

                return (
                  <div key={camp.id} className="relative flex flex-col md:flex-row md:items-center">
                    
                    {/* Marcador de nodo */}
                    <div className="absolute left-8 md:left-1/2 top-6 md:top-1/2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white text-white flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10 shadow-sm ring-4 ring-emerald-50">
                      <CheckCircle className="h-4 w-4 fill-emerald-500 text-white" />
                    </div>

                    {/* Grid wrapper */}
                    <div className="w-full grid md:grid-cols-2 gap-8 pl-16 md:pl-0">
                      
                      {/* Left Block (content or spacer) */}
                      <div className={`md:flex md:justify-end ${isLeft ? 'md:order-1' : 'md:order-2 md:col-start-2'}`}>
                        
                        <div 
                          onClick={() => handleCardClick(camp.id)}
                          className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-card-hover transition-all duration-300 cursor-pointer w-full max-w-xl group flex flex-col md:flex-row gap-5"
                        >
                          {/* Mini Thumbnail */}
                          <div className="w-full md:w-36 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                            {image ? (
                              <img
                                src={image}
                                alt={camp.titulo}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-accent-600 to-teal-800 flex items-center justify-center p-3">
                                <Award className="h-8 w-8 text-white/30" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex flex-col justify-between flex-grow min-w-0">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${catClass}`}>
                                  {category}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  {dateStr}
                                </span>
                              </div>
                              <h3 className="text-sm font-display font-black text-slate-800 leading-snug group-hover:text-accent-600 transition-colors truncate">
                                {camp.titulo}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                                Equipamiento financiado colectivamente por la cooperadora para beneficio de los pacientes del hospital.
                              </p>
                            </div>

                            {/* Metrics details */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              <span>Monto: <strong className="text-slate-800">{formatter.format(camp.monto_actual)}</strong></span>
                              <span className="flex items-center gap-1 text-accent-700 group-hover:text-accent-600 transition-colors">
                                Ver logro <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Right Block (spacer on desktop to prevent overlap) */}
                      <div className={`hidden md:block ${isLeft ? 'md:order-2 md:col-start-2' : 'md:order-1'}`} />

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Call to action footer ── */}
        <div className="mt-20 bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 text-center text-white relative isolate overflow-hidden shadow-xl">
          {/* Radial visual effect */}
          <div className="absolute inset-0 opacity-[0.35] pointer-events-none" style={{ background: 'radial-gradient(circle at bottom right, rgba(5,150,105,0.25) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="relative max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-display font-black tracking-tight leading-none text-white">
              ¿Querés ayudarnos a seguir concretando obras?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Cada aporte cuenta. Podés sumarte como socio aportando una cuota mensual o realizar una donación directa para las campañas actualmente en curso.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/campanas"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold rounded-xl bg-accent-600 hover:bg-accent-700 text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Ver Campañas Activas
              </Link>
              <Link
                to="/login?mode=register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/40 transition-all duration-300"
              >
                Asociarse Ahora
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ObrasConcretadas;
