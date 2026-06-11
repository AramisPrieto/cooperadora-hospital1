import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useLenis } from 'lenis/react';
import api from '../api/axios';
import FileUpload from '../components/FileUpload';

import CampaignCard from '../components/CampaignCard';
import {
  Newspaper, Heart, Search, FileText, Users, Target,
  TrendingUp, ArrowRight, X, CheckCircle, AlertCircle,
  ChevronRight, Banknote, Calendar, Sparkles, Copy, Check,
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

/* ── News skeleton ── */
const NewsSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse space-y-3">
    <div className="h-3 w-24 bg-slate-100 rounded-full" />
    <div className="h-5 w-3/4 bg-slate-100 rounded-full" />
    <div className="space-y-2">
      <div className="h-3 bg-slate-100 rounded-full" />
      <div className="h-3 bg-slate-100 rounded-full w-5/6" />
      <div className="h-3 bg-slate-100 rounded-full w-4/6" />
    </div>
  </div>
);

/* ── Campaign skeleton ── */
const CampaignSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="h-28 bg-gradient-to-br from-slate-200 to-slate-300" />
    <div className="p-5 space-y-4">
      <div className="h-5 w-3/4 bg-slate-100 rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 bg-slate-100 rounded-xl" />
        <div className="h-14 bg-slate-100 rounded-xl" />
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full" />
    </div>
  </div>
);

/* ── News gradient colors ── */
const NEWS_COLORS = [
  'from-teal-400 to-brand-600',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-blue-400 to-indigo-600',
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null); // News detail modal state
  const [errorMsg, setErrorMsg] = useState('');

  // States for campaign search and filters
  const [campaignSearchInput, setCampaignSearchInput] = useState('');
  const [campaignActiveSort, setCampaignActiveSort] = useState(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const campaignDebounceRef = useRef(null);

  const [donationMethod, setDonationMethod] = useState('transferencia');
  const [globalSuccessMsg, setGlobalSuccessMsg] = useState('');
  const [globalErrorMsg, setGlobalErrorMsg] = useState('');

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

  const fetchCampaigns = useCallback(async (search = '', sort = null) => {
    setLoadingCampaigns(true);
    try {
      const params = new URLSearchParams({ all: 'true' });
      if (search.trim()) params.set('search', search.trim());
      if (sort) params.set('sort', sort);
      const res = await api.get(`/campanas?${params.toString()}`);
      setCampaigns(res.data);
    } catch (err) {
      console.error('Error cargando campañas:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  // Fetch campaign list with debounce
  useEffect(() => {
    clearTimeout(campaignDebounceRef.current);
    campaignDebounceRef.current = setTimeout(() => {
      fetchCampaigns(campaignSearchInput, campaignActiveSort);
    }, 350);
    return () => clearTimeout(campaignDebounceRef.current);
  }, [campaignSearchInput, campaignActiveSort, fetchCampaigns]);

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

    const status = searchParams.get('status');
    if (status === 'donation_success') {
      setGlobalSuccessMsg('¡Donación realizada con éxito a través de Mercado Pago! Tu aporte ya se encuentra acreditado en la campaña. ¡Muchas gracias por colaborar!');
    } else if (status === 'donation_failure') {
      setGlobalErrorMsg('El pago de la donación a través de Mercado Pago fue rechazado o cancelado.');
    }

    if (viewId || status) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('view');
      newParams.delete('status');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

  // Lock scroll when a campaign or news detail modal is open
  useEffect(() => {
    if (!lenis) return;
    if (selectedCampaign || selectedNews) {
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
  }, [selectedCampaign, selectedNews, lenis]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoadingNews(true);
    try {
      const res = await api.get(`/noticias?search=${searchQuery}`);
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
        monto: parseFloat(transferAmount)
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

  const handleHeroDonate = () => {
    if (!user) navigate('/login');
    else if (campaigns.length > 0) handleViewCampaignDetail(campaigns[0].id);
    else scrollTo('campanas-section');
  };


  /* ── Computed Data ── */
  const activeCampaigns = campaigns.filter(c => parseFloat(c.monto_actual) < parseFloat(c.monto_objetivo));
  const completedCampaigns = campaigns.filter(c => parseFloat(c.monto_actual) >= parseFloat(c.monto_objetivo));
  const featuredCampaign = activeCampaigns.find(c => c.es_campana_del_mes) || activeCampaigns[0] || null;

  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const heroPct = featuredCampaign
    ? Math.min(100, Math.round((parseFloat(featuredCampaign.monto_actual) / parseFloat(featuredCampaign.monto_objetivo)) * 100))
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
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-50/80 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/4 translate-y-1/4" />

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

            {/* Right: Featured campaign card */}
            <div className="lg:col-span-5 animate-fade-up-delay-2">
              <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200 relative overflow-hidden flex flex-col">
                {/* Top badge */}
                <div className="absolute top-4 right-4">
                  <span className="badge badge-red">
                    <Sparkles className="h-3 w-3" />
                    Destacada
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    Campaña Activa del Mes
                  </p>
                  {loadingCampaigns ? (
                    <div className="h-6 w-3/4 bg-slate-100 rounded-full mt-2 animate-pulse" />
                  ) : featuredCampaign ? (
                    <p className="text-slate-900 font-black text-lg mt-1.5 leading-snug line-clamp-2">
                      {featuredCampaign.titulo}
                    </p>
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
                ) : featuredCampaign ? (
                  <>
                    {/* Amounts grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Meta</p>
                        <p className="text-slate-900 font-black text-sm leading-none">
                          {formatter.format(featuredCampaign.monto_objetivo)}
                        </p>
                      </div>
                      <div className="bg-accent-50 rounded-2xl p-4 border border-accent-100">
                        <p className="text-[9px] text-accent-700 font-black uppercase tracking-widest mb-1">Recaudado</p>
                        <p className="text-accent-700 font-black text-sm leading-none">
                          {formatter.format(featuredCampaign.monto_actual)}
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
                      className="w-full btn-brand py-3 text-sm mt-auto"
                    >
                      <Banknote className="h-4 w-4" />
                      {user ? 'Donar a esta Campaña' : 'Donar / Ver Detalles'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8">
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
              <div className="h-0.5 w-6 bg-brand-500 rounded-full" />
              Campañas Activas
              <div className="h-0.5 w-6 bg-brand-500 rounded-full" />
            </div>
            <h2 className="section-title">Campañas de Recaudación</h2>
            <p className="section-subtitle">
              Tus aportes impactan en la comunidad en tiempo real, con trazabilidad garantizada.
            </p>
          </div>
          <span className="badge badge-teal self-start md:self-end">
            <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-pulse" />
            Transparencia Total
          </span>
        </div>

        {globalSuccessMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-2xl animate-fade-up">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="flex-grow">{globalSuccessMsg}</span>
            <button onClick={() => setGlobalSuccessMsg('')} className="text-emerald-400 hover:text-emerald-600 text-xs font-bold shrink-0">✕</button>
          </div>
        )}

        {globalErrorMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl animate-fade-up">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span className="flex-grow">{globalErrorMsg}</span>
            <button onClick={() => setGlobalErrorMsg('')} className="text-rose-400 hover:text-rose-600 text-xs font-bold shrink-0">✕</button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Campaign Search and Hamburger Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={campaignSearchInput}
              onChange={(e) => setCampaignSearchInput(e.target.value)}
              placeholder="Buscar campaña por nombre..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-all font-medium shadow-sm"
            />
            {campaignSearchInput && (
              <button
                onClick={() => setCampaignSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="relative self-end sm:self-auto">
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all ${
                campaignActiveSort ? 'border-brand-500 ring-2 ring-brand-100 text-brand-700' : ''
              }`}
              title="Filtrar y Ordenar"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Ordenar</span>
              {campaignActiveSort && (
                <span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
              )}
            </button>

            {isFilterMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsFilterMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 p-3 animate-fade-in transform origin-top-right">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2.5 pb-2 mb-1.5 border-b border-slate-100 flex justify-between items-center">
                    <span>Ordenar campañas</span>
                    {campaignActiveSort && (
                      <button
                        onClick={() => { setCampaignActiveSort(null); setIsFilterMenuOpen(false); }}
                        className="text-brand-600 hover:underline capitalize font-bold"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {[
                      { key: 'urgente', label: 'Más urgentes', icon: Flame, desc: 'Fecha límite más cercana' },
                      { key: 'cercana', label: 'Cerca de la meta', icon: TrendingUp, desc: 'Mayor % completado' },
                      { key: 'mayor_meta', label: 'Mayor meta', icon: Trophy, desc: 'Objetivo más costoso' }
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isActive = campaignActiveSort === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setCampaignActiveSort(isActive ? null : opt.key);
                            setIsFilterMenuOpen(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all ${
                            isActive
                              ? 'bg-brand-50 border border-brand-100 text-brand-700 font-bold'
                              : 'hover:bg-slate-50 border border-transparent text-slate-600'
                          }`}
                        >
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                          <div>
                            <div className="text-xs font-black uppercase tracking-wider">{opt.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{opt.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map(camp => (
              <CampaignCard key={camp.id} campaign={camp} onClickDetail={handleViewCampaignDetail} />
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════
          3.5 OBRAS CONCRETADAS
      ════════════════════════════════════════ */}
      {!loadingCampaigns && completedCampaigns.length > 0 && (
        <section id="obras-section" className="bg-slate-50 py-16 px-4 border-t border-slate-200/60">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-10 gap-2">
              <div className="inline-flex items-center gap-2 mb-2 text-emerald-600 text-xs font-black uppercase tracking-widest">
                <div className="h-0.5 w-6 bg-emerald-500 rounded-full" />
                Impacto Real
                <div className="h-0.5 w-6 bg-emerald-500 rounded-full" />
              </div>
              <h2 className="section-title text-emerald-900">Obras Concretadas</h2>
              <p className="section-subtitle max-w-2xl mx-auto">
                Gracias a la solidaridad de la comunidad, hemos alcanzado el 100% de la meta en estos proyectos clave para nuestro hospital.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCampaigns.map(camp => (
                <div key={camp.id} className="bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-emerald-100 flex flex-col group relative">
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                      <CheckCircle className="h-4 w-4" />
                      100% Logrado
                    </span>
                  </div>
                  <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 flex flex-col justify-end">
                    <h3 className="text-white font-display font-black text-lg leading-tight line-clamp-2 shadow-sm">
                      {camp.titulo}
                    </h3>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <p className="text-slate-500 text-sm">
                      La comunidad logró recaudar <strong className="text-slate-800">{formatter.format(camp.monto_actual)}</strong> para hacer este proyecto realidad.
                    </p>
                    <button
                      onClick={() => handleViewCampaignDetail(camp.id)}
                      className="w-full mt-auto btn-outline text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 py-2.5 text-xs font-black uppercase tracking-widest"
                    >
                      <Search className="h-4 w-4" />
                      Ver Detalles
                    </button>
                  </div>
                </div>
              ))}
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
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 text-slate-500 text-xs font-black uppercase tracking-widest">
                <div className="h-0.5 w-6 bg-slate-400 rounded-full" />
                Novedades Institucionales
                <div className="h-0.5 w-6 bg-slate-400 rounded-full" />
              </div>
              <h2 className="section-title flex items-center gap-3">
                <Newspaper className="h-8 w-8 text-brand-500" />
                Noticias e Impacto Social
              </h2>
              <p className="section-subtitle">
                Información detallada sobre nuestros proyectos y avances en el hospital.
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center w-full md:max-w-sm">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar noticias..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-l-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-r-xl border border-brand-600 hover:border-brand-500 transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* News grid */}
          {loadingNews ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map(i => <NewsSkeleton key={i} />)}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">No se encontraron noticias.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {news.map((noti, idx) => {
                const grad = NEWS_COLORS[idx % NEWS_COLORS.length];
                return (
                  <article
                    key={noti._id}
                    onClick={() => setSelectedNews(noti)}
                    className="card group overflow-hidden rounded-3xl flex flex-col cursor-pointer hover:border-brand-200 transition-all"
                  >
                    {/* Colored header strip */}
                    <div className={`h-2 bg-gradient-to-r ${grad}`} />

                    <div className="p-6 flex flex-col flex-grow gap-3">
                      {/* Meta row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(noti.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-display font-black text-slate-800 group-hover:text-brand-700 transition-colors leading-snug">
                        {noti.titulo}
                      </h3>

                      {/* Body */}
                      <div
                        className="text-sm text-slate-600 font-light leading-relaxed line-clamp-4 flex-grow"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(noti.cuerpo_html) }}
                      />

                      {/* Read more footer */}
                      <div className="flex justify-end pt-2 border-t border-slate-50 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-brand-600 group-hover:text-brand-700">
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
          <div className="bg-white w-full sm:rounded-3xl sm:max-w-2xl shadow-dark-lg overflow-hidden sm:border sm:border-slate-100 animate-slide-down sm:animate-fade-up max-h-[90vh] sm:max-h-[85vh] flex flex-col">

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
                            alt="Aparato"
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
                      className={`flex-1 text-xs py-2 px-3 rounded-xl font-bold uppercase tracking-wider border transition-all ${
                        donationMethod === 'transferencia'
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
                      className={`flex-1 text-xs py-2 px-3 rounded-xl font-bold uppercase tracking-wider border transition-all ${
                        donationMethod === 'mp'
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
                        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-medium">Alias:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">cooperadora.hospital.nec</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('cooperadora.hospital.nec');
                                setCopiedAlias(true);
                                setTimeout(() => setCopiedAlias(false), 2000);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                              title="Copiar Alias"
                            >
                              {copiedAlias ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* CBU copiable */}
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400 font-medium">CBU:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">0140354701354701354701</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('0140354701354701354701');
                                setCopiedCbu(true);
                                setTimeout(() => setCopiedCbu(false), 2000);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                              title="Copiar CBU"
                            >
                              {copiedCbu ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
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
      {selectedNews && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedNews(null); }}
        >
          <div className="bg-white w-full sm:rounded-3xl sm:max-w-2xl shadow-2xl overflow-hidden sm:border sm:border-slate-100 animate-slide-down sm:animate-fade-up flex flex-col max-h-[85vh] sm:max-h-[75vh]">
            
            {/* Modal header */}
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <Calendar className="h-3 w-3" />
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
              {/* Optional News Image */}
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
                className="text-sm text-slate-700 font-light leading-relaxed prose max-w-none"
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

export default Home;
