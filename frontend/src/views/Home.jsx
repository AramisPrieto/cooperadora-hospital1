import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useLenis } from 'lenis/react';
import api from '../api/axios';
import FileUpload from '../components/FileUpload';

import CampaignCard from '../components/CampaignCard';
import { NewsSkeleton, CampaignSkeleton } from '../components/Skeletons';
import {
  Newspaper, Heart, Search, FileText, Users, Target,
  TrendingUp, ArrowRight, X, CheckCircle, AlertCircle,
  ChevronRight, ChevronLeft, Banknote, Calendar, Sparkles, Copy, Check,
  Flame, Trophy, SlidersHorizontal, Info
} from 'lucide-react';


/* ── Stat item ── */
const StatItem = ({ value, label, icon: Icon, color }) => (
  <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-fade-up transition-all duration-300 hover:shadow-md hover:-translate-y-1">
    <div className={`h-12 w-12 flex items-center justify-center rounded-xl shrink-0 ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <div className="text-2xl font-display font-black text-slate-800 leading-none mb-1">{value}</div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-snug">{label}</div>
    </div>
  </div>
);


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

  /* ── State for Campaigns ── */
  const [donationMethod, setDonationMethod] = useState('transferencia');
  const [globalSuccessMsg, setGlobalSuccessMsg] = useState('');
  const [globalErrorMsg, setGlobalErrorMsg] = useState('');

  /* ── Carousel states ── */
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [touchStartX, setTouchStartX] = useState(null);

  const [donationSuccess, setDonationSuccess] = useState('');
  const [donationError, setDonationError] = useState('');
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [transferReceiptUrl, setTransferReceiptUrl] = useState('');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);

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

  const handleCloseModal = () => {
    setSelectedCampaign(null);
    setTransferAmount('');
    setTransferNumber('');
    setTransferReceiptUrl('');
    setDonationSuccess('');
    setDonationError('');
    setDonationMethod('transferencia');
  };

  // TEAM_001: Envía al backend la declaración de la transferencia del socio
  const handleDeclareTransfer = async (e) => {
    e.preventDefault();
    if (!transferAmount || isNaN(transferAmount) || parseFloat(transferAmount) < 1000) {
      setDonationError('El monto mínimo para donar es $1.000.');
      return;
    }
    setSubmittingDonation(true);
    setDonationError('');
    setDonationSuccess('');
    try {
      await api.post(`/donaciones/campanas/${selectedCampaign.id}/donar-transferencia`, {
        monto: parseFloat(transferAmount),
        numero_comprobante: transferNumber,
        comprobante_url: transferReceiptUrl
      });
      setDonationSuccess('¡Muchas gracias por su donación! Pronto le llegará un mail con la confirmación de que nos llegó la transferencia. El impacto en la campaña se verá reflejado una vez que nuestro equipo valide el movimiento bancario.');
      setTransferAmount('');
      setTransferNumber('');
      setTransferReceiptUrl('');
    } catch (err) {
      console.error('Error al registrar transferencia:', err);
      setDonationError(err.response?.data?.error || 'Error al procesar la declaración en el servidor.');
    } finally {
      setSubmittingDonation(false);
    }
  };

  // Iniciar el flujo de donación online con Mercado Pago
  const handleDonationMP = async (e) => {
    e.preventDefault();
    if (!transferAmount || isNaN(transferAmount) || parseFloat(transferAmount) < 1000) {
      setDonationError('El monto mínimo para donar es $1.000.');
      return;
    }
    setSubmittingDonation(true);
    setDonationError('');
    setDonationSuccess('');
    try {
      const res = await api.post(`/donaciones/campanas/${selectedCampaign.id}/donar-mp`, {
        monto: parseFloat(transferAmount),
        frontend_url: window.location.origin
      });
      const checkoutUrl = res.data.sandboxInitPoint || res.data.initPoint;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setDonationError('No se pudo generar la URL de pago de Mercado Pago.');
        setSubmittingDonation(false);
      }
    } catch (err) {
      console.error('Error al iniciar donación MP:', err);
      setDonationError(err.response?.data?.error || 'Error al iniciar el pago con Mercado Pago.');
      setSubmittingDonation(false);
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

  const modalPct = selectedCampaign
    ? Math.min(100, Math.round((parseFloat(selectedCampaign.monto_actual) / parseFloat(selectedCampaign.monto_objetivo)) * 100))
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
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
                    {currentHeroCampaign.es_campana_del_mes ? (
                      <span className="badge badge-red animate-pulse">
                        <Sparkles className="h-3 w-3" />
                        Destacada
                      </span>
                    ) : (
                      <span className="badge badge-teal">
                        <Flame className="h-3 w-3" />
                        Activa
                      </span>
                    )}
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
                        <span className="text-accent-600 font-black">{heroPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-accent-500 rounded-full transition-all duration-1000 ease-out"
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
                  if (!user) {
                    navigate('/login?mode=register');
                  } else if (user?.rol === 'admin') {
                    navigate('/admin');
                  } else {
                    navigate('/mi-panel');
                  }
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

      {/* ════════════════════════════════════════
          5. CAMPAIGN DETAIL MODAL
      ════════════════════════════════════════ */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl sm:max-w-2xl shadow-dark-lg overflow-hidden sm:border sm:border-slate-100 animate-slide-down sm:animate-fade-up max-h-[90vh] sm:max-h-[85vh] flex flex-col">

            {/* Modal header */}
            <div className="bg-slate-50 border-b border-slate-200 p-6 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="badge badge-red">
                    <Sparkles className="h-3 w-3" />
                    Campaña en Curso
                  </span>
                  <h3 className="text-2xl font-display font-black text-slate-900 leading-tight">
                    {selectedCampaign.titulo}
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="shrink-0 h-8 w-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable content wrapper */}
            <div className="overflow-y-auto flex-grow" data-lenis-prevent>
              {/* Modal body */}
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <div className="h-0.5 w-4 bg-brand-400 rounded-full" />
                    Información de Recaudación
                    <div className="h-0.5 w-4 bg-brand-400 rounded-full" />
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <span className="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Meta Económica</span>
                      <span className="text-xl font-display font-black text-slate-800">
                        {formatter.format(selectedCampaign.monto_objetivo)}
                      </span>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                      <span className="block text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-1">Recaudación Real</span>
                      <span className="text-xl font-display font-black text-emerald-700">
                        {formatter.format(selectedCampaign.monto_actual)}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Progreso colectivo</span>
                      <span className="text-brand-600">{modalPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative shadow-inner">
                      <div
                        className="h-full bg-accent-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${modalPct}%` }}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] w-full translate-x-[-100%] animate-[shimmer_2.5s_infinite]" />
                    </div>
                  </div>

                  {/* Información del Equipo Médico */}
                  {selectedCampaign.detalles?.equipamiento_info && (
                    <div className="mt-5 border-t border-slate-100 pt-4 space-y-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-teal-600" />
                        Equipo Médico a Adquirir
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-teal-50/20 rounded-2xl p-4 border border-teal-100/80 shadow-sm hover:shadow-md transition-shadow group">
                        {selectedCampaign.detalles.equipamiento_imagen && (
                          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-white sm:col-span-1 shadow-inner relative">
                            <img
                              src={selectedCampaign.detalles.equipamiento_imagen}
                              alt={`Imagen de ${selectedCampaign.titulo}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className={selectedCampaign.detalles.equipamiento_imagen ? "sm:col-span-2 space-y-1.5" : "sm:col-span-3 space-y-1.5"}>
                          <span className="inline-block text-[9px] text-teal-700 font-black uppercase tracking-wider bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
                            Especificación Técnica
                          </span>
                          <p className="text-xs font-black text-slate-800 leading-tight">Equipo: {selectedCampaign.titulo}</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            {selectedCampaign.detalles.equipamiento_info}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* Donation footer */}
              <div className="border-t border-slate-100 bg-slate-50 p-6 space-y-4">
                {donationSuccess ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium p-4 rounded-2xl shadow-sm">
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                      <p className="leading-normal">{donationSuccess}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-full btn-brand py-3 text-sm justify-center"
                    >
                      Entendido
                    </button>
                  </div>
                ) : (
                  <>
                    {donationError && (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3.5 rounded-xl">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {donationError}
                      </div>
                    )}

                    {/* Selector de método de donación */}
                    <div className="flex gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setDonationMethod('transferencia')}
                        className={`flex-1 text-xs py-2 px-3 rounded-xl font-bold uppercase tracking-wider border transition-all ${donationMethod === 'transferencia'
                            ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <Banknote className="h-3.5 w-3.5 inline mr-1.5" />
                        CBU / Transferencia
                      </button>
                      <button
                        type="button"
                        onClick={() => setDonationMethod('mp')}
                        className={`flex-1 text-xs py-2 px-3 rounded-xl font-bold uppercase tracking-wider border transition-all ${donationMethod === 'mp'
                            ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <Heart className="h-3.5 w-3.5 inline mr-1.5" />
                        Mercado Pago
                      </button>
                    </div>

                    {donationMethod === 'transferencia' ? (
                      /* Formulario Transferencia Bancaria */
                      <form onSubmit={handleDeclareTransfer} className="space-y-4">
                        {/* Datos de cuenta */}
                        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-3 text-xs shadow-sm">
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400 font-medium">Entidad bancaria:</span>
                            <span className="text-slate-800 font-black">Banco Provincia</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400 font-medium">Razón Social:</span>
                            <span className="text-slate-800 font-black">Asoc. Cooperadora Hosp. Ferreyra</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-400 font-medium">CUIT:</span>
                            <span className="text-slate-800 font-black">30-67891234-5</span>
                          </div>

                          {/* Alias copiable */}
                          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
                            <span className="text-slate-400 font-medium">Alias:</span>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('cooperadora.hospital.nec');
                                  setCopiedAlias(true);
                                  setTimeout(() => setCopiedAlias(false), 2000);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-150 active:bg-slate-200 rounded-xl border border-slate-200/60 text-slate-800 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-[0.98]"
                                title="Copiar Alias"
                              >
                                <span className="font-mono text-xs font-bold select-all">cooperadora.hospital.nec</span>
                                <span className="p-1 rounded-lg bg-white border border-slate-150 transition-colors flex items-center justify-center">
                                  {copiedAlias ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                                </span>
                              </button>
                              {copiedAlias && (
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md animate-fade-in-tooltip pointer-events-none z-10 whitespace-nowrap">
                                  ¡Copiado!
                                </span>
                              )}
                            </div>
                          </div>

                          {/* CBU copiable */}
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <span className="text-slate-400 font-medium">CBU:</span>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('0140354701354701354701');
                                  setCopiedCbu(true);
                                  setTimeout(() => setCopiedCbu(false), 2000);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-150 active:bg-slate-200 rounded-xl border border-slate-200/60 text-slate-800 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-[0.98]"
                                title="Copiar CBU"
                              >
                                <span className="font-mono text-xs font-bold select-all">0140354701354701354701</span>
                                <span className="p-1 rounded-lg bg-white border border-slate-150 transition-colors flex items-center justify-center">
                                  {copiedCbu ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                                </span>
                              </button>
                              {copiedCbu && (
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md animate-fade-in-tooltip pointer-events-none z-10 whitespace-nowrap">
                                  ¡Copiado!
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Declarar detalles de transferencia */}
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                                Monto de tu aporte ($) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                                <input
                                  type="number"
                                  min="1000"
                                  step="any"
                                  value={transferAmount}
                                  onChange={(e) => setTransferAmount(e.target.value)}
                                  placeholder="5000"
                                  className="input-field pl-7 py-2.5 text-sm"
                                  required
                                  disabled={submittingDonation}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                                Número de Transacción / Comprobante
                              </label>
                              <input
                                type="text"
                                value={transferNumber}
                                onChange={(e) => setTransferNumber(e.target.value)}
                                placeholder="Ej: TXN-1234567"
                                className="input-field py-2.5 text-sm"
                                disabled={submittingDonation}
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <FileUpload
                                tipo="comprobante"
                                value={transferReceiptUrl}
                                onChange={setTransferReceiptUrl}
                                label="Comprobante de transferencia (opcional)"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={handleCloseModal}
                              disabled={submittingDonation}
                              className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap disabled:opacity-50"
                            >
                              Cerrar
                            </button>
                            <button
                              type="submit"
                              disabled={submittingDonation}
                              className="flex-1 btn-brand text-xs py-3 px-6 whitespace-nowrap disabled:opacity-50 w-full"
                            >
                              {submittingDonation ? 'Procesando...' : 'Reportar Transferencia'}
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      /* Formulario Mercado Pago */
                      <form onSubmit={handleDonationMP} className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                              Monto a donar ($) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                              <input
                                type="number"
                                min="1000"
                                step="any"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                placeholder="5000"
                                className="input-field pl-7 py-2.5 text-sm"
                                required
                                disabled={submittingDonation}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            disabled={submittingDonation}
                            className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            Cerrar
                          </button>
                          <button
                            type="submit"
                            disabled={submittingDonation}
                            className="flex-1 btn-brand text-xs py-3 px-6 whitespace-nowrap disabled:opacity-50 w-full"
                          >
                            {submittingDonation ? 'Redirigiendo...' : 'Donar con Mercado Pago'}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          4.5 NEWS DETAIL MODAL
      ════════════════════════════════════════ */}

    </div>
  );
};

export default Home;
