import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import CampaignCard from '../components/CampaignCard';
import { CampaignSearchSkeleton } from '../components/Skeletons';
import { Search, X, Target, ChevronLeft, ChevronRight } from 'lucide-react';

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
  // Reset page when category, search input, sort, or underlying campaigns change
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
      // Solo campañas activas: excluir las que ya alcanzaron el 100% (ésas van a Obras Concretadas)
      const active = res.data.filter(
        c => parseFloat(c.monto_actual) < parseFloat(c.monto_objetivo)
      );
      setCampaigns(active);
    } catch (err) {
      console.error('Error cargando campañas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial y búsqueda con debounce
  useEffect(() => {
    if (searchInput === '') {
      fetchCampaigns('', activeSort);
      return;
    }

    const timer = setTimeout(() => {
      fetchCampaigns(searchInput, activeSort);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, activeSort, fetchCampaigns]);

  const handleClearSearch = () => {
    setSearchInput('');
  };

  const handleViewDetail = (id) => {
    navigate(`/campanas/${id}`);
  };

  // 1. Calcular cantidades por categoría basados en la lista devuelta por la búsqueda
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

  // 2. Filtrar las campañas en base a la categoría seleccionada
  const filteredCampaigns = campaigns.filter(c => {
    if (activeCategory === 'Todas') return true;
    return getCategoryFromTitle(c.titulo) === activeCategory;
  });

  // 3. Paginación (6 por página)
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
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200/60'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative background blur shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-50/40 rounded-full blur-[120px] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-50/30 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* ── Breadcrumb ── */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <li>
              <Link to="/" className="hover:text-brand-600 transition-colors flex items-center gap-1.5">
                Inicio
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <li className="text-slate-800 font-extrabold" aria-current="page">
              Campañas
            </li>
          </ol>
        </nav>

        {/* ── SECCIÓN SUPERIOR: TÍTULOS ── */}
        <header className="pt-4 pb-6 space-y-3.5 text-left">
          <span className="block text-xs font-black uppercase text-brand-600 tracking-widest">
            Campañas
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 leading-tight tracking-tight">
            Buscá la causa que más te interesa
          </h1>
        </header>

        {/* ── BARRA DE BÚSQUEDA ── */}
        <section className="pb-6">
          <div className="relative max-w-xl">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por servicio, equipo, área..."
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all font-medium shadow-inner"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-550 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* ── BARRA DE FILTROS (CHIPS + ORDENAR) ── */}
      <section className="pb-8 border-b border-slate-200/60">
        <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
          
          {/* Categorías (Chips) */}
          <div className="flex gap-2 flex-wrap items-center">
            {CATEGORIES.map(cat => {
              const count = categoryCounts[cat] || 0;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border
                    ${isActive
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm scale-[1.01]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }
                  `}
                >
                  <span>{cat}</span>
                  <span className={`
                    text-[9px] px-1.5 py-0.5 rounded-md font-bold
                    ${isActive ? 'bg-white/20 text-white/90' : 'bg-slate-100 text-slate-400'}
                  `}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selector de ordenamiento */}
          <div className="flex items-center shrink-0">
            <label className="text-xs font-bold text-slate-400 mr-2.5 uppercase tracking-wider">Ordenar:</label>
            <select
              value={activeSort}
              onChange={e => setActiveSort(e.target.value)}
              className="bg-white border border-slate-200/90 hover:border-slate-350 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-sm transition-colors"
            >
              <option value="">Más urgentes</option>
              <option value="cercana">Cerca de la meta</option>
              <option value="mayor_meta">Mayor meta</option>
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        {!loading && (
          <div className="mt-5 text-xs text-slate-500 font-extrabold uppercase tracking-wider">
            {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campaña' : 'campañas'}
          </div>
        )}
      </section>

      {/* ── GRID DE CAMPAÑAS ── */}
      <main className="py-10">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <CampaignSearchSkeleton key={i} />)}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
              <Target className="h-8 w-8 text-slate-300 animate-pulse" />
            </div>
            <div>
              <p className="text-slate-700 font-black text-base">No se encontraron campañas</p>
              <p className="text-slate-400 text-xs mt-1">
                {searchInput
                  ? `No hay campañas activas que coincidan con "${searchInput}" para esta sección.`
                  : 'No hay campañas cargadas en esta categoría en este momento.'}
              </p>
            </div>
            {(searchInput || activeCategory !== 'Todas') && (
              <button
                onClick={() => { setSearchInput(''); setActiveCategory('Todas'); fetchCampaigns('', activeSort); }}
                className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
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
              <div className="flex items-center justify-center gap-1.5 mt-12 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all duration-200 ${
                    currentPage === 1
                      ? 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:border-slate-350'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {renderPageNumbers()}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all duration-200 ${
                    currentPage === totalPages
                      ? 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:border-slate-350'
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  </div>
  );
};

export default CampaignSearch;
