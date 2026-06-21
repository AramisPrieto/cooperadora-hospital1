import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Search, 
  Calendar, 
  ChevronRight,
  Award,
  X,
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
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isSocioOrAdmin = user && (user.rol === 'socio' || user.rol === 'admin');
  
  // State
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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


  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch = c.titulo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [campaigns, searchQuery]);

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
        <header className="pt-4 pb-6 space-y-3.5 text-left max-w-3xl">
          <span className="block text-xs font-black uppercase text-brand-600 tracking-widest">
            Obras Concretadas
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-slate-900 tracking-tight leading-none">
            Proyectos hechos realidad
          </h1>
          <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed">
            Gracias al compromiso inquebrantable de la comunidad, comercios y socios, transformamos fondos en infraestructura de salud pública de calidad. Aquí se detallan los logros alcanzados.
          </p>
        </header>

        {/* ── BARRA DE BÚSQUEDA ── */}
        <section className="pb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
            <input
              id="search-obras-input"
              type="text"
              placeholder="Buscar obra concretada..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all font-medium shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-550 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>

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
              No hay proyectos concretados que coincidan con la búsqueda. Intenta limpiar la búsqueda.
            </p>
            <button
              onClick={() => { setSearchQuery(''); }}
              className="mt-6 btn-accent px-6 py-2.5 text-xs inline-flex"
            >
              Limpiar Búsqueda
            </button>
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
              {isSocioOrAdmin 
                ? "Como socio, tu apoyo constante hace posibles estos logros. Podés realizar una donación directa para las campañas que se encuentran en curso."
                : "Cada aporte cuenta. Podés sumarte como socio aportando una cuota mensual o realizar una donación directa para las campañas actualmente en curso."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/campanas"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold rounded-xl bg-accent-600 hover:bg-accent-700 text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Ver Campañas Activas
              </Link>
              {!isSocioOrAdmin && (
                <Link
                  to="/login?mode=register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/40 transition-all duration-300"
                >
                  Asociarse Ahora
                </Link>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ObrasConcretadas;
