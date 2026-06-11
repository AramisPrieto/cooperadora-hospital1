import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CampaignCard from '../components/CampaignCard';
import { Search, X, Target } from 'lucide-react';

/* ── Skeleton ── */
const CampaignSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-slate-100" />
    <div className="p-5 space-y-4">
      <div className="h-4 bg-slate-100 rounded w-1/4" />
      <div className="h-5 bg-slate-100 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-2.5 bg-slate-100 rounded-full w-full" />
      </div>
    </div>
  </div>
);

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
  const debounceRef = useRef(null);

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

  // Carga inicial
  useEffect(() => {
    fetchCampaigns('', activeSort);
  }, [activeSort, fetchCampaigns]);

  // Búsqueda con debounce
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

  return (
    <div className="min-h-screen bg-white pb-20 pt-6">
      
      {/* ── SECCIÓN SUPERIOR: TÍTULOS ── */}
      <header className="max-w-6xl mx-auto px-4 pt-12 pb-6 space-y-3.5">
        <span className="block text-xs font-black uppercase text-brand-600 tracking-widest">
          Campañas
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 leading-tight tracking-tight">
          Buscá la causa que más te interesa
        </h1>
      </header>

      {/* ── BARRA DE BÚSQUEDA ── */}
      <section className="max-w-6xl mx-auto px-4 pb-6">
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
      <section className="max-w-6xl mx-auto px-4 pb-8 border-b border-slate-100">
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
      <main className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <CampaignSkeleton key={i} />)}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map(camp => (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                onClickDetail={handleViewDetail}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CampaignSearch;
