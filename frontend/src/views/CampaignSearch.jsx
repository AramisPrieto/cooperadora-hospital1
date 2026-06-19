import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CampaignCard from '../components/CampaignCard';
import { CampaignSearchSkeleton } from '../components/Skeletons';
import { Search, X, Target, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  'Todas',
  'Neonatología',
  'Emergencias',
  'Diagnóstico',
  'Terapia Intensiva',
  'Pediatría',
  'Laboratorio',
];

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

const CampaignSearch = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeSort, setActiveSort] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef(null);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchInput, activeSort, campaigns]);

  const fetchCampaigns = useCallback(async (search = '', sort = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ all: 'true' });
      if (search.trim()) params.set('search', search.trim());
      if (sort) params.set('sort', sort);
      const res = await api.get(`/campanas?${params.toString()}`);
      setCampaigns(res.data);
    } catch (err) {
      console.error('Error cargando campañas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCampaigns('', activeSort);
  }, [activeSort, fetchCampaigns]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCampaigns(searchInput, activeSort);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, activeSort, fetchCampaigns]);

  const handleClearSearch = () => {
    setSearchInput('');
  };

  const handleViewDetail = (id) => {
    navigate(`/campanas/${id}`);
  };

  // 1. Calculate count per category
  const categoryCounts = {
    Todas: campaigns.length,
    Neonatología: 0,
    Emergencias: 0,
    Diagnóstico: 0,
    'Terapia Intensiva': 0,
    Pediatría: 0,
    Laboratorio: 0,
  };

  campaigns.forEach(c => {
    const cat = getCategoryFromTitle(c.titulo);
    if (categoryCounts[cat] !== undefined) {
      categoryCounts[cat]++;
    }
  });

  // 2. Filter list by selected category
  const filteredCampaigns = campaigns.filter(c => {
    if (activeCategory === 'Todas') return true;
    return getCategoryFromTitle(c.titulo) === activeCategory;
  });

  // 3. Paginate (6 per page)
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`h-9 w-9 rounded-xl text-xs font-bold transition-all duration-200 ${
            currentPage === i
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10 scale-105'
              : 'bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 border border-slate-200/60 shadow-sm'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-20 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-50/40 rounded-full blur-[120px] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent-50/40 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/4" />

      {/* ── HEADER ── */}
      <header className="max-w-6xl mx-auto px-4 pt-12 pb-6 space-y-3 relative z-10 text-left">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-50 text-brand-700 border border-brand-100">
          Iniciativas Médicas
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 leading-tight tracking-tight">
          Buscá la causa que <br className="hidden sm:block" />
          <span className="text-brand-600">más te interesa apoyar</span>
        </h1>
      </header>

      {/* ── SEARCH BAR ── */}
      <section className="max-w-6xl mx-auto px-4 pb-6 relative z-10">
        <div className="relative max-w-xl group">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none transition-colors group-focus-within:text-brand-500" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por servicio, equipo, área médica..."
            className="w-full pl-12 pr-11 py-4 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-semibold shadow-sm hover:border-slate-300"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              aria-label="Borrar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* ── FILTERS BAR (Chips + Sort) ── */}
      <section className="max-w-6xl mx-auto px-4 pb-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between border-b border-slate-200/60 pb-6">
          
          {/* Categories Chips */}
          <div className="flex gap-2 flex-wrap items-center text-left">
            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat] || 0;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0
                    ${isActive
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10 scale-102'
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350 hover:shadow-sm'
                    }
                  `}
                >
                  <span>{cat}</span>
                  <span className={`
                    text-[9px] px-2 py-0.5 rounded-full font-black font-sans transition-colors
                    ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-450'}
                  `}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center shrink-0 w-full lg:w-auto">
            <SlidersHorizontal className="h-4 w-4 text-slate-400 mr-2" />
            <label className="text-[10px] font-black text-slate-400 mr-2.5 uppercase tracking-wider">Ordenar por:</label>
            <select
              value={activeSort}
              onChange={e => setActiveSort(e.target.value)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 cursor-pointer shadow-sm transition-all"
            >
              <option value="">Más urgentes</option>
              <option value="cercana">Cerca de la meta</option>
              <option value="mayor_meta">Mayor meta</option>
            </select>
          </div>
        </div>

        {/* Results count indicator */}
        {!loading && (
          <div className="mt-5 text-[10px] text-slate-400 font-black uppercase tracking-wider text-left pl-1">
            Encontrado: {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campaña' : 'campañas'}
          </div>
        )}
      </section>

      {/* ── GRID OF CAMPAIGNS ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <CampaignSearchSkeleton key={i} />)}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col items-center gap-4 max-w-xl mx-auto">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
              <Target className="h-8 w-8 text-slate-300 animate-pulse" />
            </div>
            <div>
              <p className="text-slate-800 font-black text-base">No se encontraron campañas</p>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-semibold max-w-xs mx-auto">
                {searchInput
                  ? `No hay campañas activas que coincidan con tu búsqueda "${searchInput}". Intenta con otros términos.`
                  : 'No hay campañas cargadas en esta categoría en este momento.'}
              </p>
            </div>
            {(searchInput || activeCategory !== 'Todas') && (
              <button
                onClick={() => { setSearchInput(''); setActiveCategory('Todas'); fetchCampaigns('', activeSort); }}
                className="mt-2 btn-brand py-2.5 px-6 text-xs shadow-md"
              >
                Ver todas las campañas
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCampaigns.map(camp => (
                <CampaignCard
                  key={camp.id}
                  campaign={camp}
                  onClickDetail={handleViewDetail}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-slate-200/60">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all duration-200 shadow-sm ${
                    currentPage === 1
                      ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:border-slate-350'
                  }`}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {renderPageNumbers()}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all duration-200 shadow-sm ${
                    currentPage === totalPages
                      ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:border-slate-350'
                  }`}
                  aria-label="Siguiente página"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CampaignSearch;
