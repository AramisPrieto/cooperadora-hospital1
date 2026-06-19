import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import DOMPurify from 'dompurify';
import { Search, X, Calendar, ArrowRight, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsSearchSkeleton } from '../components/Skeletons';

const CATEGORIES = [
  'Todas',
  'Logro',
  'Hospital',
  'Transparencia',
  'Empresas',
  'Institucional'
];

const getCategoryForNews = (noti) => {
  const tags = noti.tags || [];
  const title = (noti.titulo || '').toLowerCase();
  
  // Tag-based mapping (case-insensitive)
  for (const tag of tags) {
    const t = tag.toLowerCase();
    if (t.includes('donac') || t.includes('solidar') || t.includes('logro') || t.includes('aporte')) return 'Logro';
    if (t.includes('equip') || t.includes('guardia') || t.includes('hospital') || t.includes('insumo')) return 'Hospital';
    if (t.includes('auditor') || t.includes('transpar') || t.includes('caja') || t.includes('balance')) return 'Transparencia';
    if (t.includes('empresa') || t.includes('comercio') || t.includes('corporat')) return 'Empresas';
    if (t.includes('socio') || t.includes('comun') || t.includes('instituc') || t.includes('asamble') || t.includes('web') || t.includes('tecnol')) return 'Institucional';
  }

  // Fallback title-based mapping
  if (title.includes('donación') || title.includes('recaud') || title.includes('aporte') || title.includes('entregamos') || title.includes('respirador') || title.includes('logro')) return 'Logro';
  if (title.includes('cardio') || title.includes('desfibrilador') || title.includes('médic') || title.includes('guardia') || title.includes('enfermer') || title.includes('hospital') || title.includes('quirúrg')) return 'Hospital';
  if (title.includes('auditor') || title.includes('transparencia') || title.includes('fondo') || title.includes('rendid') || title.includes('balance') || title.includes('cuenta')) return 'Transparencia';
  if (title.includes('empresa') || title.includes('comercio') || title.includes('frigorífico') || title.includes('corporativo')) return 'Empresas';
  if (title.includes('socio') || title.includes('asamblea') || title.includes('lanzamiento') || title.includes('plataforma') || title.includes('web') || title.includes('citación')) return 'Institucional';

  return 'General';
};

const formatShortDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[date.getMonth()];
  return `${day} ${month}`;
};

const getPlainTextSnippet = (htmlString, maxLength = 120) => {
  if (!htmlString) return '';
  const cleanText = htmlString.replace(/<\/?[^>]+(>|$)/g, "");
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength) + '...';
};

const NewsSearch = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [activeSort, setActiveSort] = useState('recientes');
  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef(null);

  // Reset page when category, search input, active sort, or underlying news change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchInput, activeSort, news]);

  const fetchNews = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' }); // Fetch news up to 100
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/noticias?${params.toString()}`);
      setNews(res.data);
    } catch (err) {
      console.error('Error cargando noticias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNews('');
  }, [fetchNews]);

  // Search with debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchNews(searchInput);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, fetchNews]);

  const handleClearSearch = () => {
    setSearchInput('');
  };

  // 1. Calculate category counts based on current search result
  const categoryCounts = {
    Todas: news.length,
    Logro: 0,
    Hospital: 0,
    Transparencia: 0,
    Empresas: 0,
    Institucional: 0,
  };

  news.forEach(n => {
    const cat = getCategoryForNews(n);
    if (categoryCounts[cat] !== undefined) {
      categoryCounts[cat]++;
    }
  });

  // 2. Filter news by active category
  const filteredNews = news.filter(n => {
    if (activeCategory === 'Todas') return true;
    return getCategoryForNews(n) === activeCategory;
  });

  // 3. Sort news by date
  const sortedNews = [...filteredNews].sort((a, b) => {
    const dateA = new Date(a.fecha || 0);
    const dateB = new Date(b.fecha || 0);
    if (activeSort === 'recientes') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  // 4. Pagination
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(sortedNews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedNews = sortedNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
          <ol className="flex items-center gap-2 text-xs font-semibold text-slate-505">
            <li>
              <Link to="/" className="hover:text-brand-600 transition-colors flex items-center gap-1.5">
                Inicio
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <li className="text-slate-800 font-extrabold" aria-current="page">
              Noticias
            </li>
          </ol>
        </nav>

        {/* ── TOP HEADER ── */}
        <header className="pt-4 pb-6 space-y-3.5 text-left">
          <span className="block text-xs font-black uppercase text-brand-600 tracking-widest">
            Noticias y Logros
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 leading-tight tracking-tight">
            Qué hicimos con tu aporte
          </h1>
        </header>

        {/* ── SEARCH INPUT ── */}
        <section className="pb-6">
          <div className="relative max-w-xl">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar noticias..."
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

      {/* ── CATEGORY CHIPS ── */}
      <section className="pb-8 border-b border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-350'
                    }
                  `}
                >
                  <span>{cat === 'Todas' ? 'Todas' : cat}</span>
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

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ordenar por:</span>
            <select
              value={activeSort}
              onChange={e => setActiveSort(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all cursor-pointer shadow-sm hover:border-slate-300"
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguas">Más antiguas</option>
            </select>
          </div>
        </div>

        {/* Results counter */}
        {!loading && (
          <div className="mt-5 text-xs text-slate-500 font-extrabold uppercase tracking-wider">
            {sortedNews.length} {sortedNews.length === 1 ? 'noticia' : 'noticias'}
          </div>
        )}
      </section>

      {/* ── MAIN NEWS GRID ── */}
      <main className="py-10">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <NewsSearchSkeleton key={i} />)}
          </div>
        ) : sortedNews.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
              <Newspaper className="h-8 w-8 text-slate-300 animate-pulse" />
            </div>
            <div>
              <p className="text-slate-700 font-black text-base">No se encontraron noticias</p>
              <p className="text-slate-400 text-xs mt-1">
                {searchInput
                  ? `No hay noticias que coincidan con "${searchInput}" para esta sección.`
                  : 'No hay noticias cargadas en esta categoría en este momento.'}
              </p>
            </div>
            {(searchInput || activeCategory !== 'Todas') && (
              <button
                onClick={() => { setSearchInput(''); setActiveCategory('Todas'); fetchNews(''); }}
                className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Ver todas las noticias
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedNews.map(noti => {
                const cat = getCategoryForNews(noti);
                const snippet = getPlainTextSnippet(noti.cuerpo_html);
                return (
                  <article
                    key={noti._id}
                    onClick={() => navigate(`/noticias/${noti._id}`)}
                    className="bg-white rounded-[2rem] border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    {/* Top Image or Placeholder */}
                    <div className="aspect-[16/10] w-full overflow-hidden relative border-b border-slate-100 shrink-0 bg-slate-50">
                      {noti.imagen_url ? (
                        <img
                          src={noti.imagen_url}
                          alt={noti.titulo}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      {/* Fallback placeholder – shown when no image or image fails to load */}
                      <div
                        className={`absolute inset-0 items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 overflow-hidden ${noti.imagen_url ? 'hidden' : 'flex'}`}
                      >
                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl" />
                        <div className="relative flex flex-col items-center gap-2 opacity-40">
                          <Newspaper className="h-10 w-10 text-white" />
                          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{cat}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow gap-3 text-left">
                      {/* Category and date row */}
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                        <span className="text-brand-600 tracking-widest">{cat}</span>
                        <span className="text-slate-400 font-bold">{formatShortDate(noti.fecha)}</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-slate-900 font-display font-black text-base leading-snug group-hover:text-brand-600 transition-colors duration-200 line-clamp-2">
                        {noti.titulo}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3">
                        {snippet}
                      </p>

                      {/* Leer noticia link */}
                      <div className="flex justify-end pt-3 border-t border-slate-50 mt-auto">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-600 group-hover:text-brand-700">
                          Leer noticia
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-12 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all duration-200 ${
                    currentPage === 1
                      ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
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
                      ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
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

export default NewsSearch;
