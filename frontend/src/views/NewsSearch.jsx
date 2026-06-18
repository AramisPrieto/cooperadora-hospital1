import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DOMPurify from 'dompurify';
import { Search, X, Calendar, ArrowRight, Newspaper } from 'lucide-react';

/* ── Skeleton ── */
const NewsSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-slate-100" />
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <div className="h-3 bg-slate-100 rounded w-1/4" />
        <div className="h-3 bg-slate-100 rounded w-1/6" />
      </div>
      <div className="h-5 bg-slate-100 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
      </div>
    </div>
  </div>
);

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
  const [selectedNews, setSelectedNews] = useState(null);
  const debounceRef = useRef(null);

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

  const diagonalPlaceholderStyle = {
    backgroundImage: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 2px, transparent 2px, transparent 10px)'
  };

  return (
    <div className="min-h-screen bg-white pb-20 pt-24">
      {/* ── TOP HEADER ── */}
      <header className="max-w-6xl mx-auto px-4 pt-12 pb-6 space-y-3.5">
        <span className="block text-xs font-black uppercase text-brand-600 tracking-widest">
          Noticias y Logros
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 leading-tight tracking-tight">
          Qué hicimos con tu aporte
        </h1>
      </header>

      {/* ── SEARCH INPUT ── */}
      <section className="max-w-6xl mx-auto px-4 pb-6">
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
      <section className="max-w-6xl mx-auto px-4 pb-8 border-b border-slate-100">
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

        {/* Results counter */}
        {!loading && (
          <div className="mt-5 text-xs text-slate-500 font-extrabold uppercase tracking-wider">
            {filteredNews.length} {filteredNews.length === 1 ? 'noticia' : 'noticias'}
          </div>
        )}
      </section>

      {/* ── GRID OF CARDS ── */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <NewsSkeleton key={i} />)}
          </div>
        ) : filteredNews.length === 0 ? (
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map(noti => {
              const cat = getCategoryForNews(noti);
              const snippet = getPlainTextSnippet(noti.cuerpo_html);
              return (
                <article
                  key={noti._id}
                  onClick={() => setSelectedNews(noti)}
                  className="bg-white rounded-[2rem] border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  {/* Top Image or Placeholder */}
                  <div className="aspect-[16/10] w-full overflow-hidden relative border-b border-slate-100 shrink-0 bg-slate-50">
                    {noti.imagen_url ? (
                      <img
                        src={noti.imagen_url}
                        alt={noti.titulo}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div
                      className={`absolute inset-0 items-center justify-center ${noti.imagen_url ? 'hidden' : 'flex'}`}
                      style={diagonalPlaceholderStyle}
                    >
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white/95 px-3.5 py-1.5 rounded-full shadow-sm border border-slate-100">
                        IMG · {cat}
                      </span>
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
        )}
      </main>

      {/* ── NEWS DETAIL MODAL ── */}
      {selectedNews && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedNews(null); }}
        >
          <div className="bg-white w-full sm:rounded-3xl sm:max-w-2xl shadow-2xl overflow-hidden sm:border sm:border-slate-100 flex flex-col max-h-[85vh] sm:max-h-[75vh]">
            {/* Modal header */}
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(selectedNews.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">
                  {selectedNews.titulo}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNews(null)}
                className="shrink-0 h-8 w-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-grow" data-lenis-prevent>
              {/* News Image */}
              {selectedNews.imagen_url && (
                <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-4">
                  <img
                    src={selectedNews.imagen_url}
                    alt={selectedNews.titulo}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Tags */}
              {selectedNews.tags && selectedNews.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {selectedNews.tags.map(tag => (
                    <span key={tag} className="badge badge-slate">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Body Content */}
              <div
                className="text-sm text-slate-700 font-light leading-relaxed prose max-w-none text-left"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedNews.cuerpo_html) }}
              />
            </div>

            {/* Modal footer */}
            <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end">
              <button
                onClick={() => setSelectedNews(null)}
                className="btn-accent px-6 py-2.5 text-xs font-black uppercase tracking-wider"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsSearch;
