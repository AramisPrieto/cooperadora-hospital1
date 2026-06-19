import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import DOMPurify from 'dompurify';
import { ArrowLeft, Calendar, ChevronRight, Newspaper, Clock, ArrowRight, Share2 } from 'lucide-react';
import ShareModal from '../components/ShareModal';

/* ── Helpers ── */
const formatLongDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
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

const getCategoryForNews = (noti) => {
  if (!noti) return 'General';
  const tags = noti.tags || [];
  const title = (noti.titulo || '').toLowerCase();

  for (const tag of tags) {
    const t = tag.toLowerCase();
    if (t.includes('donac') || t.includes('solidar') || t.includes('logro') || t.includes('aporte')) return 'Logro';
    if (t.includes('equip') || t.includes('guardia') || t.includes('hospital') || t.includes('insumo')) return 'Hospital';
    if (t.includes('auditor') || t.includes('transpar') || t.includes('caja') || t.includes('balance')) return 'Transparencia';
    if (t.includes('empresa') || t.includes('comercio') || t.includes('corporat')) return 'Empresas';
    if (t.includes('socio') || t.includes('comun') || t.includes('instituc') || t.includes('asamble') || t.includes('web') || t.includes('tecnol')) return 'Institucional';
  }

  if (title.includes('donación') || title.includes('recaud') || title.includes('aporte') || title.includes('entregamos') || title.includes('respirador') || title.includes('logro')) return 'Logro';
  if (title.includes('cardio') || title.includes('desfibrilador') || title.includes('médic') || title.includes('guardia') || title.includes('enfermer') || title.includes('hospital') || title.includes('quirúrg')) return 'Hospital';
  if (title.includes('auditor') || title.includes('transparencia') || title.includes('fondo') || title.includes('rendid') || title.includes('balance') || title.includes('cuenta')) return 'Transparencia';
  if (title.includes('empresa') || title.includes('comercio') || title.includes('frigorífico') || title.includes('corporativo')) return 'Empresas';
  if (title.includes('socio') || title.includes('asamblea') || title.includes('lanzamiento') || title.includes('plataforma') || title.includes('web') || title.includes('citación')) return 'Institucional';

  return 'General';
};

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [noti, setNoti] = useState(null);
  const [otherNews, setOtherNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/noticias/${id}`);
        setNoti(res.data);

        // Fetch other news for recommendation
        const otherRes = await api.get('/noticias?limit=4');
        setOtherNews(otherRes.data.filter(n => n._id !== id).slice(0, 3));
      } catch (err) {
        console.error('Error al cargar detalle de noticia:', err);
        setError('No se pudo cargar la noticia solicitada.');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
    // Scroll back to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-600" />
          <span className="text-slate-450 text-xs font-bold uppercase tracking-wider">Cargando noticia...</span>
        </div>
      </div>
    );
  }

  if (error || !noti) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-20 flex flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
          <Newspaper className="h-8 w-8 text-slate-300 animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-slate-800 font-display font-black text-xl">Noticia no encontrada</h2>
          <p className="text-slate-400 text-xs mt-1">{error || 'La novedad no existe o fue retirada.'}</p>
        </div>
        <button
          onClick={() => navigate('/noticias')}
          className="btn-accent px-6 py-3 text-xs font-black uppercase tracking-wider"
        >
          Volver a noticias
        </button>
      </div>
    );
  }

  const category = getCategoryForNews(noti);
  const diagonalPlaceholderStyle = {
    backgroundImage: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 2px, transparent 2px, transparent 10px)'
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

      {/* Decorative background blur shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-50/40 rounded-full blur-[120px] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-50/30 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── BREADCRUMBS & NAVIGATION ── */}
        <nav className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Link to="/" className="hover:text-slate-800 transition-colors">Inicio</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/noticias" className="hover:text-slate-800 transition-colors">Noticias</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-600 truncate max-w-[200px] sm:max-w-[350px]">{noti.titulo}</span>
          </div>
        </nav>

        {/* ── ARTICLE VIEW ── */}
        <main className="max-w-4xl mx-auto pt-4 pb-12">
          <article className="bg-white rounded-[2rem] border border-slate-200/60 p-8 sm:p-12 shadow-sm space-y-8 text-left">
            {/* Header Row */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-widest text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-full">
                  {category}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatLongDate(noti.fecha)}
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 leading-tight tracking-tight">
                {noti.titulo}
              </h1>
            </div>

            {/* Main Image or Pattern placeholder */}
            <div className="aspect-[21/9] w-full overflow-hidden rounded-[2rem] border border-slate-200 shadow-sm relative bg-slate-50">
              {noti.imagen_url ? (
                <img
                  src={noti.imagen_url}
                  alt={noti.titulo}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                className={`absolute inset-0 items-center justify-center ${noti.imagen_url ? 'hidden' : 'flex'}`}
                style={diagonalPlaceholderStyle}
              >
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white/95 px-5 py-2.5 rounded-full shadow-sm border border-slate-100">
                  Cooperadora Municipal · {category}
                </span>
              </div>
            </div>

            {/* Body Content */}
            <div className="grid lg:grid-cols-12 gap-8 pt-4">
              {/* Main Article Body */}
              <div className="lg:col-span-8 space-y-6">
                <div
                  className="text-slate-700 text-sm sm:text-base leading-relaxed font-light prose max-w-none text-left"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(noti.cuerpo_html) }}
                />


              </div>

              {/* Sticky Sidebar details */}
              <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-8 space-y-6">
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-250/20 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Acerca de esta publicación
                  </h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-start text-slate-500 font-semibold gap-4">
                      <span className="shrink-0">Área:</span>
                      <span className="text-slate-800 font-black text-right">{category}</span>
                    </div>
                    <div className="flex justify-between items-start text-slate-500 font-semibold gap-4">
                      <span className="shrink-0">Publicado:</span>
                      <span className="text-slate-800 font-black text-right">{formatLongDate(noti.fecha)}</span>
                    </div>
                    <div className="flex justify-between items-start text-slate-500 font-semibold gap-4">
                      <span className="shrink-0">Lectura:</span>
                      <span className="text-slate-800 font-black inline-flex items-start justify-end gap-1 text-right">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>3 min</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={() => setIsShareOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    <Share2 className="h-4 w-4" />
                    Compartir publicación
                  </button>
                  <button
                    onClick={() => navigate('/noticias')}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a noticias
                  </button>
                </div>
              </div>
            </div>
          </article>
        </main>

        {/* ── RECOMMENDATIONS / OTHER NEWS ── */}
        {otherNews.length > 0 && (
          <section className="border-t border-slate-200/60 py-16 mt-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 text-left">
                <div>
                  <span className="text-[10px] font-black uppercase text-brand-600 tracking-widest block mb-1">
                    Recomendados
                  </span>
                  <h2 className="text-2xl font-display font-black text-slate-800 leading-tight">
                    Otras noticias recientes
                  </h2>
                </div>
                <Link
                  to="/noticias"
                  className="text-xs font-black uppercase tracking-wider text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5"
                >
                  Ver todas las noticias
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherNews.map(item => {
                  const itemCat = getCategoryForNews(item);
                  const itemSnippet = getPlainTextSnippet(item.cuerpo_html);
                  return (
                    <article
                      key={item._id}
                      onClick={() => navigate(`/noticias/${item._id}`)}
                      className="bg-white rounded-[2rem] border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-350 transition-all duration-300 flex flex-col group cursor-pointer text-left"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-[16/10] w-full overflow-hidden relative border-b border-slate-100 shrink-0 bg-slate-50">
                        {item.imagen_url ? (
                          <img
                            src={item.imagen_url}
                            alt={item.titulo}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div
                          className={`absolute inset-0 items-center justify-center ${item.imagen_url ? 'hidden' : 'flex'}`}
                          style={diagonalPlaceholderStyle}
                        >
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/95 px-3 py-1 rounded-full shadow-sm border border-slate-100">
                            {itemCat}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-grow gap-2.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
                          <span className="text-brand-600">{itemCat}</span>
                          <span className="text-slate-400 font-bold">{formatShortDate(item.fecha)}</span>
                        </div>
                        <h3 className="text-slate-900 font-display font-black text-sm leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
                          {item.titulo}
                        </h3>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed line-clamp-3">
                          {itemSnippet}
                        </p>
                        <div className="flex justify-end pt-2 border-t border-slate-50 mt-auto">
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-brand-600 group-hover:text-brand-700">
                            Leer noticia
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={window.location.href}
        title={noti?.titulo || ''}
        summary={getPlainTextSnippet(noti?.cuerpo_html || '')}
        imageUrl={noti?.imagen_url || ''}
        shareMessage={`¡Hola! Te comparto esta noticia importante de la Cooperadora del Hospital Emilio Ferreyra: "${noti?.titulo || ''}"`}
      />
    </div>
  </div>
);
};

export default NewsDetail;
