import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useLenis } from 'lenis/react';
import api from '../api/axios';
import DonationModal from '../components/home/DonationModal';
import CampaignCard from '../components/CampaignCard';
import { NewsSkeleton, CampaignSkeleton } from '../components/Skeletons';
import {
  Newspaper, Heart, Search, FileText, Users, Target,
  TrendingUp, ArrowRight, X, CheckCircle, AlertCircle,
  ChevronRight, ChevronLeft, Banknote, Calendar, Check,
  Flame, Trophy, SlidersHorizontal, Info
} from 'lucide-react';


/* ── getPlainTextSnippet ── */
const getPlainTextSnippet = (htmlString, maxLength = 120) => {
  if (!htmlString) return '';
  const cleanText = htmlString.replace(/<\/?[^>]+(>|$)/g, "");
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength) + '...';
};


/* ── News gradient colors ── */
const NEWS_COLORS = [
  'from-teal-400 to-brand-600',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-blue-400 to-indigo-600',
];

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NewsSearchForm = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full md:max-w-sm">
      <div className="relative flex-grow">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar noticias..."
          maxLength={100}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-l-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-all"
        />
      </div>
      <button
        type="submit"
        aria-label="Buscar noticias"
        className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-r-xl border border-brand-600 hover:border-brand-500 transition-colors"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lenis = useLenis(); // TEAM_001: Hook de Lenis para control de scroll
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };
  const [campaigns, setCampaigns] = useState([]);
  const [news, setNews] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  /* ── Notification messages ── */
  const [globalSuccessMsg, setGlobalSuccessMsg] = useState('');
  const [globalErrorMsg, setGlobalErrorMsg] = useState('');

  /* ── Carousel states ── */
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [touchStartX, setTouchStartX] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleViewCampaignDetail = (id) => {
    navigate(`/campanas/${id}`);
  };

  const fetchCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const res = await api.get('/campanas');
      setCampaigns(res.data);
    } catch (err) {
      console.error('Error cargando campañas:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  // Fetch campaign list on mount
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Fetch news list
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get('/noticias');
        setNews(res.data);
      } catch (err) {
        console.error('Error cargando noticias:', err);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && localStorage.getItem('user')) {
      api.get(`/campanas/${viewId}`)
        .then(res => setSelectedCampaign(res.data))
        .catch(err => console.error('Error abriendo campaña desde URL:', err));
    }

    const donationStatus = searchParams.get('donation_status') || searchParams.get('status');
    if (donationStatus === 'success' || donationStatus === 'donation_success') {
      setGlobalSuccessMsg('¡Donación realizada con éxito a través de Mercado Pago! Tu aporte ya se encuentra acreditado en la campaña. ¡Muchas gracias por colaborar!');
    } else if (donationStatus === 'failure' || donationStatus === 'donation_failure') {
      setGlobalErrorMsg('El pago de la donación a través de Mercado Pago fue rechazado o cancelado.');
    }

    if (viewId || searchParams.has('donation_status') || searchParams.has('status')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('view');
      newParams.delete('donation_status');
      newParams.delete('status');

      // Limpiar otros parámetros de Mercado Pago para dejar la URL limpia
      const mpParams = [
        'collection_id', 'collection_status', 'payment_id', 'payment_type',
        'merchant_order_id', 'preference_id', 'site_id', 'processing_mode',
        'merchant_account_id', 'external_reference'
      ];
      mpParams.forEach(param => newParams.delete(param));

      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

  // Lock scroll when a campaign detail modal is open
  useEffect(() => {
    if (!lenis) return;
    if (selectedCampaign) {
      lenis.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenis.start();
      document.body.style.overflow = '';
    }
    return () => {
      if (lenis) {
        lenis.start();
      }
      document.body.style.overflow = '';
    };
  }, [selectedCampaign, lenis]);

  const handleSearch = async (query) => {
    setLoadingNews(true);
    try {
      const res = await api.get(`/noticias?search=${query}`);
      setNews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNews(false);
    }
  };


  const handleHeroAssociate = () => {
    if (!user) navigate('/login');
    else if (user?.rol === 'admin') navigate('/admin');
    else scrollTo('campanas-section');
  };

  /* ── Computed Data ── */
  const activeCampaigns = useMemo(() =>
    campaigns.filter(c => parseFloat(c.monto_actual) < parseFloat(c.monto_objetivo)),
    [campaigns]
  );
  const completedCampaigns = useMemo(() =>
    campaigns.filter(c => parseFloat(c.monto_actual) >= parseFloat(c.monto_objetivo)),
    [campaigns]
  );
  const currentHeroCampaign = activeCampaigns[activeCampaignIndex] || null;

  const handleHeroDonate = () => {
    if (!user) navigate('/login');
    else if (currentHeroCampaign) handleViewCampaignDetail(currentHeroCampaign.id);
    else scrollTo('campanas-section');
  };

  /* ── Carousel Handlers ── */
  const handleCampaignChange = (newIndex) => {
    setFade(false);
    setTimeout(() => {
      setActiveCampaignIndex(newIndex);
      setFade(true);
    }, 150);
  };

  const handleNextCampaign = () => {
    if (activeCampaigns.length <= 1) return;
    handleCampaignChange((activeCampaignIndex + 1) % activeCampaigns.length);
  };

  const handlePrevCampaign = () => {
    if (activeCampaigns.length <= 1) return;
    handleCampaignChange((activeCampaignIndex - 1 + activeCampaigns.length) % activeCampaigns.length);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;
    if (diffX > 50) {
      handleNextCampaign();
    } else if (diffX < -50) {
      handlePrevCampaign();
    }
    setTouchStartX(null);
  };

  // Reset index when campaigns list length changes
  useEffect(() => {
    setActiveCampaignIndex(0);
  }, [activeCampaigns.length]);



  const heroPct = currentHeroCampaign
    ? Math.min(100, Math.round((parseFloat(currentHeroCampaign.monto_actual) / parseFloat(currentHeroCampaign.monto_objetivo)) * 100))
    : 0;

  return (
    <div className="flex-grow bg-slate-50">

      {/* ════════════════════════════════════════
          1. HERO SECTION
      ════════════════════════════════════════ */}
      <section className="min-h-[620px] flex items-center border-b border-slate-100 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        {/* Subtle decorative shapes for clinical aesthetic */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-50/80 rounded-full blur-[120px] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-16 sm:pb-24">
          
          {user?.perfil?.estado === 'pendiente' && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-amber-100/80 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
                  <Info className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider leading-none">Registro en proceso de aprobación</h4>
                  <p className="text-[11px] text-amber-700 mt-1.5 font-semibold leading-normal">
                    Hola, <strong className="text-amber-800">{user.perfil.nombre || user.email}</strong>. Tu perfil de socio ha sido registrado con éxito y está siendo procesado por la comisión directiva. Te enviamos un correo de confirmación (revisá tu bandeja de entrada o spam).
                  </p>
                </div>
              </div>
              <Link
                to="/mi-panel"
                className="shrink-0 text-[10px] font-black text-amber-800 hover:text-amber-900 uppercase tracking-widest bg-amber-100/60 hover:bg-amber-100 px-3.5 py-2 rounded-xl border border-amber-200 transition-colors"
              >
                Ver mi perfil
              </Link>
            </div>
          )}

          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* Left: text */}
            <div className="lg:col-span-7 space-y-8">


              {/* Headline */}
              <div className="animate-fade-up-delay-1">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black leading-[1.08] text-slate-900 text-balance">
                  Cada aporte{' '}
                  <span className="text-brand-600">equipa un quirófano</span>
                  ,{' '}
                  <br className="hidden sm:block" />
                  cada socio{' '}
                  <span className="text-accent-600">salva una vida</span>.
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-slate-600 text-lg leading-relaxed max-w-xl font-medium animate-fade-up-delay-2">
                Desde la Cooperadora del Hospital Municipal <strong className="text-slate-800">«Dr. Emilio Ferreyra»</strong> canalizamos la buena voluntad de la comunidad de Necochea y Quequén para equipar y mejorar nuestra salud pública.
              </p>


            </div>

            {/* Right: Featured campaign card / Carousel */}
            <div className="lg:col-span-5 animate-fade-up-delay-2 animate-fade">
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="bg-white rounded-3xl p-6 shadow-card border border-slate-200 relative overflow-hidden flex flex-col group min-h-[360px]"
              >
                {/* Navigation Arrows for Carousel */}
                {!loadingCampaigns && activeCampaigns.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevCampaign}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/95 border border-slate-200/80 shadow-md flex items-center justify-center text-slate-600 hover:text-brand-600 hover:border-brand-100 transition-all duration-200 hover:scale-105 active:scale-95 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:outline-none"
                      aria-label="Campaña anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextCampaign}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/95 border border-slate-200/80 shadow-md flex items-center justify-center text-slate-600 hover:text-brand-600 hover:border-brand-100 transition-all duration-200 hover:scale-105 active:scale-95 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:outline-none"
                      aria-label="Siguiente campaña"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}

                {/* Top badge */}
                {!loadingCampaigns && currentHeroCampaign && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="badge badge-teal">
                      <Flame className="h-3 w-3" />
                      Activa
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    {activeCampaigns.length > 1
                      ? `Campañas Activas (${activeCampaignIndex + 1}/${activeCampaigns.length})`
                      : 'Campaña Activa del Mes'}
                  </p>
                  {loadingCampaigns ? (
                    <div className="h-6 w-3/4 bg-slate-100 rounded-full mt-2 animate-pulse" />
                  ) : currentHeroCampaign ? (
                    <div className={`transition-all duration-200 ${fade ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-[0.99]'}`}>
                      <p className="text-slate-900 font-black text-lg mt-1.5 leading-snug line-clamp-2 pr-16">
                        {currentHeroCampaign.titulo}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm mt-1.5 italic">Sin campañas activas</p>
                  )}
                </div>

                {loadingCampaigns ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-20 bg-slate-50 rounded-2xl" />
                    <div className="h-3 bg-slate-100 rounded-full" />
                    <div className="h-10 bg-slate-100 rounded-xl" />
                  </div>
                ) : currentHeroCampaign ? (
                  <div className={`flex-grow flex flex-col transition-all duration-200 ${fade ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-[0.99]'}`}>
                    {/* Amounts grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Meta</p>
                        <p className="text-slate-900 font-black text-sm leading-none">
                          {formatter.format(currentHeroCampaign.monto_objetivo)}
                        </p>
                      </div>
                      <div className="bg-accent-50 rounded-2xl p-4 border border-accent-100">
                        <p className="text-[9px] text-accent-700 font-black uppercase tracking-widest mb-1">Recaudado</p>
                        <p className="text-accent-700 font-black text-sm leading-none">
                          {formatter.format(currentHeroCampaign.monto_actual)}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-bold">Progreso de la obra</span>
                        <span className="text-emerald-600 font-black">{heroPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${heroPct}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA donate */}
                    <button
                      onClick={handleHeroDonate}
                      className="w-full btn-brand py-3 text-sm mt-auto shadow-sm"
                    >
                      <Banknote className="h-4 w-4" />
                      {user ? 'Donar a esta Campaña' : 'Donar / Ver Detalles'}
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    {/* Carousel Dots */}
                    {activeCampaigns.length > 1 && (
                      <div className="flex justify-center gap-1.5 mt-4">
                        {activeCampaigns.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCampaignChange(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeCampaignIndex ? 'w-4 bg-brand-500' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                              }`}
                            aria-label={`Ir a campaña ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 my-auto">
                    <Target className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">El equipo prepara nuevas iniciativas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>



      {/* ════════════════════════════════════════
          3. CAMPAIGNS SECTION
      ════════════════════════════════════════ */}
      <section id="campanas-section" className="max-w-7xl mx-auto py-16 px-4">
        {/* Section heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 text-brand-600 text-xs font-black uppercase tracking-widest">
              Campañas Activas
            </div>
            <h2 className="section-title">Campañas de Recaudación</h2>
            <p className="section-subtitle">
              Tus aportes impactan en la comunidad en tiempo real, con trazabilidad garantizada.
            </p>
          </div>
        </div>

        {globalSuccessMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-2xl animate-fade-up">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="flex-grow">{globalSuccessMsg}</span>
            <button onClick={() => setGlobalSuccessMsg('')} aria-label="Cerrar mensaje de éxito" className="text-emerald-400 hover:text-emerald-600 text-xs font-bold shrink-0">✕</button>
          </div>
        )}

        {globalErrorMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl animate-fade-up">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span className="flex-grow">{globalErrorMsg}</span>
            <button onClick={() => setGlobalErrorMsg('')} aria-label="Cerrar mensaje de error" className="text-rose-400 hover:text-rose-600 text-xs font-bold shrink-0">✕</button>
          </div>
        )}

        {loadingCampaigns ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <CampaignSkeleton key={i} />)}
          </div>
        ) : activeCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <Target className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No hay campañas en recaudación en este momento.</p>
            <p className="text-slate-400 text-sm mt-1">El equipo está preparando nuevas iniciativas.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCampaigns.slice(0, 3).map(camp => (
                <CampaignCard key={camp.id} campaign={camp} onClickDetail={handleViewCampaignDetail} />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => navigate('/campanas')}
                className="btn-accent px-8 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-300"
              >
                Ver más campañas
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </section>

      {/* ════════════════════════════════════════
          3.5 OBRAS CONCRETADAS
      ════════════════════════════════════════ */}
      {!loadingCampaigns && completedCampaigns.length > 0 && (
        <section id="obras-section" className="bg-slate-50 py-16 px-4 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 text-left">
              <div className="inline-flex items-center gap-2 mb-3 text-brand-600 text-xs font-black uppercase tracking-widest">
                Impacto Real
              </div>
              <h2 className="section-title">Obras Concretadas</h2>
              <p className="section-subtitle">
                Gracias a la solidaridad de la comunidad, hemos alcanzado el 100% de la meta en estos proyectos clave para nuestro hospital.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCampaigns.slice(0, 3).map(camp => (
                <CampaignCard
                  key={camp.id}
                  campaign={camp}
                  onClickDetail={handleViewCampaignDetail}
                />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <button
                onClick={() => navigate('/obras-concretadas')}
                className="btn-accent px-8 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-300"
              >
                Ver más obras
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          4. NEWS SECTION
      ════════════════════════════════════════ */}
      <section id="noticias-section" className="bg-gradient-to-b from-slate-50 to-slate-100 border-t border-slate-200/60 py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Heading */}
          <div className="mb-10 text-left">
            <div className="inline-flex items-center gap-2 mb-3 text-brand-600 text-xs font-black uppercase tracking-widest">
              Novedades Institucionales
            </div>
            <h2 className="section-title flex items-center gap-3">
              Noticias e Impacto Social
            </h2>
            <p className="section-subtitle">
              Información detallada sobre nuestros proyectos y avances en el hospital.
            </p>
          </div>

          {/* News grid */}
          {loadingNews ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <NewsSkeleton key={i} />)}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">No se encontraron noticias.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.slice(0, 3).map((noti, idx) => {
                  const grad = NEWS_COLORS[idx % NEWS_COLORS.length];
                  const snippet = getPlainTextSnippet(noti.cuerpo_html, 90);
                  return (
                    <article
                      key={noti._id}
                      onClick={() => navigate(`/noticias/${noti._id}`)}
                      className="group bg-white rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer relative"
                    >
                      {/* Image with gradient fallback */}
                      <div className="aspect-[16/10] w-full overflow-hidden relative shrink-0 bg-slate-50 border-b border-slate-100">
                        {noti.imagen_url ? (
                          <img
                            src={noti.imagen_url}
                            alt={noti.titulo}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        {/* Gradient fallback */}
                        <div
                          className={`absolute inset-0 items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 overflow-hidden ${noti.imagen_url ? 'hidden' : 'flex'}`}
                        >
                          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
                          <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-20`} />
                          <div className="relative flex flex-col items-center gap-2 opacity-40">
                            <Newspaper className="h-10 w-10 text-white" />
                          </div>
                        </div>
                        {/* Colored accent strip at bottom of image */}
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${grad}`} />
                      </div>

                      <div className="p-5 flex flex-col flex-grow gap-3.5 text-left">
                        {/* Meta row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(noti.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-display font-black text-slate-800 group-hover:text-brand-700 transition-colors leading-snug line-clamp-2">
                          {noti.titulo}
                        </h3>

                        {/* Body */}
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 flex-grow">
                          {snippet}
                        </p>

                        {/* Read more footer */}
                        <div className="flex justify-end pt-3 border-t border-slate-100 mt-auto">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-brand-600 group-hover:text-brand-700">
                            Leer noticia
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => navigate('/noticias')}
                  className="btn-accent px-8 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Ver más noticias
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          4.2 HACETE SOCIO BANNER (CTA)
      ════════════════════════════════════════ */}
      {!user && (
        <section className="bg-slate-100 py-12 px-4 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-950 rounded-[2rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Background elements for premium look */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-900/10 rounded-full blur-[100px] pointer-events-none transform translate-x-1/4 -translate-y-1/4" />

              {/* Left Column: Title, description, button */}
              <div className="relative z-10 space-y-6 max-w-xl text-left">
                <span className="text-brand-500 font-extrabold text-xs uppercase tracking-widest block">
                  Hacete socio
                </span>
                <h2 className="text-3xl sm:text-4xl font-display font-black leading-tight text-white">
                  $4.500 al mes. <br />
                  Equipamiento todo el año.
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  Tu cuota mensual financia el plan operativo del hospital de manera previsible.
                  Recibís comprobantes legales y podés deducir Ganancias.
                </p>
                <button
                  onClick={() => {
                    navigate('/login?mode=register');
                  }}
                  className="btn-brand bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all inline-flex items-center gap-2 text-sm shadow-md"
                >
                  Asociarme ahora
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Right Column: Benefits list */}
              <div className="relative z-10 w-full md:w-auto shrink-0 md:max-w-xs space-y-4">
                {[
                  "Comprobantes legales descargables",
                  "Cancelás cuando quieras",
                  "Auditoría externa anual",
                  "Voto en Asamblea Anual"
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                    </div>
                    <span className="text-slate-200 text-sm font-bold tracking-wide">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          5. CAMPAIGN DETAIL / DONATION MODAL
      ════════════════════════════════════════ */}
      {selectedCampaign && (
        <DonationModal
          selectedCampaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onDonationSuccess={() => fetchCampaigns()}
        />
      )}

      {/* ════════════════════════════════════════
          4.5 NEWS DETAIL MODAL
      ════════════════════════════════════════ */}

    </div>
  );
};

export default Home;
