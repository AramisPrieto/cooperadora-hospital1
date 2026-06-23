import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLenis } from 'lenis/react';
import api from '../api/axios';
import FileUpload from '../components/FileUpload';
import ShareModal from '../components/ShareModal';
import {
  Heart, ArrowLeft, Calendar, Clock, Target, TrendingUp,
  Share2, CheckCircle, AlertCircle, ShieldCheck, Banknote,
  ImageOff, ChevronRight, Copy, Check, Users, Sparkles,
  BadgeAlert, X, Info
} from 'lucide-react';

/* ── Helpers ────────────────────────────────────────────── */
const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS',
  minimumFractionDigits: 0, maximumFractionDigits: 0
});

const getDaysLeft = (fechaLimite) => {
  if (!fechaLimite) return null;
  return Math.max(0, Math.ceil((new Date(fechaLimite) - new Date()) / 86400000));
};

const getCategoryFromTitle = (title) => {
  if (!title) return 'General';
  const t = title.toLowerCase();
  if (t.includes('neonato') || t.includes('bebé') || t.includes('cuna')) return 'Neonatología';
  if (t.includes('emergencia') || t.includes('guardia') || t.includes('desfibrilador') || t.includes('paro')) return 'Emergencias';
  if (t.includes('diagnóstic') || t.includes('mamógraf') || t.includes('rayos') || t.includes('ecógraf') || t.includes('tomógraf') || t.includes('resonador') || t.includes('mamógrafo')) return 'Diagnóstico';
  if (t.includes('terapia') || t.includes('oxígeno') || t.includes('respirador') || t.includes('ventilador')) return 'Terapia Intensiva';
  if (t.includes('pediatr') || t.includes('niño') || t.includes('juegos') || t.includes('infantil')) return 'Pediatría';
  if (t.includes('laboratorio') || t.includes('centrífuga') || t.includes('analizador') || t.includes('microscopio')) return 'Laboratorio';
  return 'General';
};

const getEquipmentDetails = (title) => {
  const category = getCategoryFromTitle(title);
  switch (category) {
    case 'Neonatología':
      return {
        modelo: 'GE Logiq E (portátil)',
        proveedor: 'Tecnoimagen S.A.',
        garantia: '3 años + service local',
        pacientes: '~3.200'
      };
    case 'Emergencias':
      return {
        modelo: 'Zoll AED Plus (desfibrilador)',
        proveedor: 'Medtronic Argentina S.A.',
        garantia: '2 años + service oficial',
        pacientes: '~1.800'
      };
    case 'Diagnóstico':
      return {
        modelo: 'Philips Affiniti 70 (ecógrafo)',
        proveedor: 'Siemens Healthineers S.A.',
        garantia: '3 años + calibración anual',
        pacientes: '~4.500'
      };
    case 'Terapia Intensiva':
      return {
        modelo: 'Dräger Evita V300 (respirador)',
        proveedor: 'Dräger Argentina S.A.',
        garantia: '2 años + mantenimiento preventivo',
        pacientes: '~1.200'
      };
    case 'Pediatría':
      return {
        modelo: 'Medix C-200 (cuna de calor radiante)',
        proveedor: 'Gemed S.A.',
        garantia: '3 años + service técnico',
        pacientes: '~2.500'
      };
    case 'Laboratorio':
      return {
        modelo: 'Mindray BC-5300 (analizador)',
        proveedor: 'Biomédica Dist. S.A.',
        garantia: '2 años + calibración semestral',
        pacientes: '~5.000'
      };
    default:
      return {
        modelo: 'Bionet BM5 (monitor multiparamétrico)',
        proveedor: 'JAE Eléctrica S.A.',
        garantia: '1 año + service oficial',
        pacientes: '~2.000'
      };
  }
};

const formatTimelineDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const getTimelineEvents = (campaign, pct, daysLeft) => {
  const events = [];
  const start = campaign.createdAt ? new Date(campaign.createdAt) : new Date(Date.now() - 30 * 24 * 3600000);
  
  // Evento 1: Apertura
  events.push({
    date: formatTimelineDate(start),
    title: 'Campaña abierta',
    detail: 'Aprobada por la Comisión Directiva',
    isLimit: false
  });

  // Evento 2: Donación corporativa o hito intermedio (si hay algún avance)
  if (pct >= 5) {
    const midDate = new Date(start.getTime() + 12 * 24 * 3600000);
    const isNeonatologia = campaign.titulo.toLowerCase().includes('neonato');
    events.push({
      date: formatTimelineDate(midDate),
      title: isNeonatologia ? 'Donación corporativa Frigorífico SA' : 'Donación institucional inicial',
      detail: isNeonatologia ? '$500.000 aportados' : 'Primeros aportes de la comunidad recibidos',
      isLimit: false
    });
  }

  // Evento 3: Hito importante (si superó el 50%)
  if (pct >= 50) {
    const milestoneDate = new Date(start.getTime() + 20 * 24 * 3600000);
    events.push({
      date: formatTimelineDate(milestoneDate),
      title: `Hito: ${pct >= 80 ? '80%' : '50%'} de la meta`,
      detail: pct >= 80 ? 'Activación de comunicación final' : 'Progreso de recaudación a paso firme',
      isLimit: false
    });
  }

  // Evento 4: Cierre o Fecha Límite
  const limitDate = campaign.fecha_limite ? new Date(campaign.fecha_limite) : new Date(start.getTime() + 45 * 24 * 3600000);
  const isComplete = pct >= 100;
  events.push({
    date: formatTimelineDate(limitDate),
    title: isComplete ? 'Meta alcanzada' : `Quedan ${daysLeft !== null ? daysLeft : 12} días`,
    detail: isComplete ? 'Agradecemos a todos los donantes por su colaboración' : 'Cierre del período de recaudación',
    isLimit: true
  });

  return events;
};

/* ── Skeleton ───────────────────────────────────────────── */
const DetailSkeleton = () => (
  <div className="animate-pulse max-w-6xl mx-auto px-4 py-10 space-y-8">
    <div className="h-4 w-56 bg-slate-200 rounded-full" />
    <div className="h-10 w-3/4 bg-slate-200 rounded-full" />
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="aspect-[16/9] bg-slate-200 rounded-3xl" />
        <div className="space-y-3 bg-white rounded-3xl p-6 border border-slate-100">
          <div className="h-4 w-1/3 bg-slate-100 rounded-full" />
          <div className="h-3 bg-slate-100 rounded-full" />
          <div className="h-3 w-5/6 bg-slate-100 rounded-full" />
          <div className="h-3 w-4/6 bg-slate-100 rounded-full" />
        </div>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 h-fit">
        <div className="h-6 w-3/4 bg-slate-100 rounded-full" />
        <div className="h-3 bg-slate-100 rounded-full" />
        <div className="h-12 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  </div>
);

/* ── Donante item ───────────────────────────────────────── */
const DonanteItem = ({ iniciales, monto, timeAgo }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 group">
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[11px] font-black text-slate-600 shrink-0 group-hover:from-brand-100 group-hover:to-brand-200 group-hover:text-brand-700 transition-all">
        {iniciales[0]}
      </div>
      <div>
        <p className="text-sm font-black text-slate-700">{iniciales}</p>
        <p className="text-[11px] text-slate-400 font-medium">{timeAgo}</p>
      </div>
    </div>
    <span className="text-sm font-black text-emerald-600">{formatter.format(monto)}</span>
  </div>
);

/* ── Modal Donación ─────────────────────────────────────── */
const DonationModal = ({ campaign, onClose, onSuccess }) => {
  const [method, setMethod] = useState('transferencia');
  const [amount, setAmount] = useState('');
  const [txNumber, setTxNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const navigate = useNavigate();

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) < 1000) {
      setError('El monto mínimo para donar es $1.000.');
      return;
    }
    setSubmitting(true); setError('');
    try {
      await api.post(`/donaciones/campanas/${campaign.id}/donar-transferencia`, {
        monto: parseFloat(amount),
        numero_comprobante: txNumber,
        comprobante_url: receiptUrl
      });
      setSuccess('¡Muchas gracias por tu donación! Recibirás un correo de confirmación una vez que nuestro equipo valide la transferencia.');
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la donación.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMP = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) < 1000) {
      setError('El monto mínimo para donar es $1.000.');
      return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await api.post(`/donaciones/campanas/${campaign.id}/donar-mp`, {
        monto: parseFloat(amount),
        frontend_url: window.location.origin
      });
      const url = res.data.sandboxInitPoint || res.data.initPoint;
      if (url) window.location.href = url;
      else setError('No se pudo generar la URL de Mercado Pago.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center space-y-5">
          <div className="h-16 w-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-brand-600 fill-brand-200" />
          </div>
          <h3 className="text-xl font-display font-black text-slate-900">Iniciar sesión para donar</h3>
          <p className="text-slate-500 text-sm">Necesitás una cuenta para realizar tu donación y recibir el comprobante.</p>
          <button onClick={() => navigate('/login')} className="w-full btn-brand py-3 text-sm">
            Iniciar sesión
          </button>
          <button onClick={onClose} className="text-slate-400 text-sm hover:text-slate-600 transition-colors">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl sm:max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-fade-up max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Donar a</p>
            <h3 className="text-lg font-display font-black text-slate-900 leading-snug">{campaign.titulo}</h3>
          </div>
          <button onClick={onClose} aria-label="Cerrar modal de donación" className="h-8 w-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-grow" data-lenis-prevent>
          {success ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium p-4 rounded-2xl">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <p>{success}</p>
              </div>
              <button onClick={onClose} className="w-full btn-brand py-3 text-sm">Entendido</button>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3.5 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Tabs método */}
              <div className="flex gap-2">
                {[
                  { key: 'transferencia', label: 'Transferencia / CBU', icon: Banknote },
                  { key: 'mp', label: 'Mercado Pago', icon: Heart }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMethod(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 px-3 rounded-xl font-bold uppercase tracking-wider border transition-all ${
                      method === key
                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {method === 'transferencia' ? (
                <form onSubmit={handleTransfer} className="space-y-4">
                  {/* Datos bancarios */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
                    {[
                      { label: 'Banco', value: 'Banco Provincia' },
                      { label: 'Razón Social', value: 'Asoc. Cooperadora Hosp. Ferreyra' },
                      { label: 'CUIT', value: '30-67891234-5' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-medium">{label}:</span>
                        <span className="text-slate-800 font-black">{value}</span>
                      </div>
                    ))}
                    {/* Alias copiable */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">Monto ($) *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                        <input type="number" min="1000" step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000" className="input-field pl-7 py-2.5 text-sm" required disabled={submitting} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">N° Comprobante</label>
                      <input type="text" value={txNumber} onChange={e => setTxNumber(e.target.value)} placeholder="TXN-1234567" className="input-field py-2.5 text-sm" disabled={submitting} />
                    </div>
                    <div className="sm:col-span-2">
                      <FileUpload
                        tipo="comprobante"
                        value={receiptUrl}
                        onChange={setReceiptUrl}
                        label="Comprobante de transferencia (opcional)"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={onClose} disabled={submitting} className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50">Cancelar</button>
                    <button type="submit" disabled={submitting} className="flex-1 btn-brand text-xs py-3 disabled:opacity-50">
                      {submitting ? 'Enviando…' : 'Confirmar donación'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleMP} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">Monto a donar ($) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                      <input type="number" min="1000" step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder="5000" className="input-field pl-7 py-2.5 text-sm" required disabled={submitting} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={onClose} disabled={submitting} className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50">Cancelar</button>
                    <button type="submit" disabled={submitting} className="flex-1 btn-brand text-xs py-3 disabled:opacity-50">
                      {submitting ? 'Redirigiendo…' : 'Pagar con Mercado Pago'}
                    </button>
                  </div>
                </form>
              )}

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-600 font-semibold pt-1">
                <ShieldCheck className="h-4 w-4" />
                Pago seguro vía Mercado Pago o transferencia bancaria
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const CARD_GRADIENTS = [
  'from-teal-500 via-brand-500 to-emerald-600',
  'from-blue-500 via-indigo-500 to-blue-700',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-rose-500 via-pink-500 to-red-600',
  'from-amber-400 via-orange-500 to-red-500',
  'from-cyan-500 via-teal-500 to-brand-600',
];

const CATEGORY_STYLES = {
  Neonatología: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  Emergencias: 'bg-amber-50 text-amber-700 border border-amber-100',
  Diagnóstico: 'bg-blue-50 text-blue-700 border border-blue-100',
  'Terapia Intensiva': 'bg-purple-50 text-purple-700 border border-purple-100',
  Pediatría: 'bg-pink-50 text-pink-700 border border-pink-100',
  Laboratorio: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  General: 'bg-slate-50 text-slate-700 border border-slate-100',
};

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const lenis = useLenis();

  const [campaign, setCampaign] = useState(null);
  const [donantes, setDonantes] = useState([]);
  const [totalDonors, setTotalDonors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Scroll al inicio al montar la página
  useEffect(() => {
    window.scrollTo(0, 0);
    if (lenis) lenis.scrollTo(0, { immediate: true });
  }, [id]);

  // Recalcular dimensiones de Lenis cuando carga el contenido
  useEffect(() => {
    if (!loading && lenis) {
      setTimeout(() => lenis.resize(), 100);
    }
  }, [loading, lenis]);

  // Lock scroll when showDonationModal is active
  useEffect(() => {
    if (!lenis) return;
    if (showDonationModal) {
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
  }, [showDonationModal, lenis]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [campRes, donRes] = await Promise.allSettled([
          api.get(`/campanas/${id}`),
          api.get(`/campanas/${id}/donantes`)
        ]);
        if (campRes.status === 'fulfilled') {
          setCampaign(campRes.value.data);
        } else {
          setError('No se encontró esta campaña.');
        }
        if (donRes.status === 'fulfilled') {
          setDonantes(donRes.value.data.donantes || []);
          setTotalDonors(donRes.value.data.total || 0);
        }
      } catch {
        setError('Error al cargar la campaña.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleShare = () => {
    setIsShareOpen(true);
  };

  if (loading) return <DetailSkeleton />;

  if (error || !campaign) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4">
        <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-rose-400" />
        </div>
        <p className="text-slate-700 font-black text-xl">{error || 'Campaña no encontrada'}</p>
        <button onClick={() => navigate('/campanas')} className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Volver al buscador
        </button>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((parseFloat(campaign.monto_actual) / parseFloat(campaign.monto_objetivo)) * 100));
  const daysLeft = getDaysLeft(campaign.fecha_limite);
  const isUrgent = daysLeft !== null && daysLeft <= 14;
  const isComplete = pct >= 100;
  const gradientClass = CARD_GRADIENTS[campaign.id % CARD_GRADIENTS.length];
  const images = campaign.detalles?.galeria_rica?.imagenes || [];
  const obraStatus = campaign.detalles?.obra_status || '';
  const testimonios = campaign.detalles?.testimonios || [];
  const equipamientoInfo = campaign.detalles?.equipamiento_info || '';
  const equipamientoImagen = campaign.detalles?.equipamiento_imagen || '';
  const faltante = Math.max(0, parseFloat(campaign.monto_objetivo) - parseFloat(campaign.monto_actual));

  const category = getCategoryFromTitle(campaign.titulo);
  const categoryClass = CATEGORY_STYLES[category] || CATEGORY_STYLES.General;
  const equipmentSpecs = getEquipmentDetails(campaign.titulo);
  const timelineEvents = getTimelineEvents(campaign, pct, daysLeft);
  const donorCount = totalDonors > 0
    ? totalDonors
    : (parseFloat(campaign.monto_actual) === 0
        ? 0
        : (Math.round(parseFloat(campaign.monto_actual) / 12000) + (campaign.id * 11) + 14));

  const isNeonatologia = campaign.titulo.toLowerCase().includes('neonato');
  const descriptionParagraphs = (equipamientoInfo && equipamientoInfo.trim())
    ? equipamientoInfo.split('\n\n')
    : isNeonatologia
      ? [
          "Equipamiento crítico para diagnóstico no invasivo en recién nacidos prematuros. El servicio del Hospital Ferreyra atiende un promedio de 1.200 pacientes por mes en esta área.",
          "La compra fue priorizada por la Dirección Médica del hospital. Una vez alcanzada la meta, la cooperadora gestiona la adquisición y entrega formal en un plazo máximo de 60 días, con acta firmada y publicada en la sección de Transparencia."
        ]
      : [
          `Esta campaña tiene como objetivo principal la adquisición de equipamiento de última generación para mejorar la atención médica en nuestro hospital. La colaboración de la comunidad es fundamental para concretar este proyecto.`,
          `Una vez alcanzada la meta de recaudación, la Asociación Cooperadora del Hospital Ferreyra gestionará de manera inmediata la compra y entrega formal del equipo, publicando el acta de transparencia correspondiente.`
        ];

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
            <li>
              <Link to="/campanas" className="hover:text-brand-600 transition-colors">
                Campañas
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <li className="text-slate-800 font-extrabold truncate max-w-[200px] sm:max-w-[300px]" aria-current="page">
              {campaign.titulo}
            </li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* ══ LEFT COLUMN ══ */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#fff5f5] text-[#b91c1c] border border-[#fee2e2] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                  {category}
                </span>
                {isUrgent && !isComplete && (
                  <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                    Urgente
                  </span>
                )}
                {isComplete && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Meta Alcanzada
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-900 leading-tight tracking-tight">
                {campaign.titulo}
              </h1>
            </div>

            {/* Main Image / Placeholder */}
            {images.length > 0 ? (
              <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm group">
                <img
                  src={images[0]}
                  alt={campaign.titulo}
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-out"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="hidden w-full h-full bg-slate-100 items-center justify-center flex-col gap-3 text-slate-400">
                  <ImageOff className="h-12 w-12" />
                  <p className="text-sm font-medium">Imagen no disponible</p>
                </div>
              </div>
            ) : (
              /* Custom diagonal stripes visual placeholder matching screenshot */
              <div
                className="relative aspect-[16/9] rounded-3xl border border-slate-200 bg-white shadow-sm flex items-center justify-center overflow-hidden"
                style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #f9fafb, #f9fafb 15px, #f3f4f6 15px, #f3f4f6 30px)' }}
              >
                <div className="text-slate-500 font-mono text-[10px] font-bold tracking-widest uppercase select-none text-center p-6 bg-white/85 backdrop-blur-sm rounded-xl border border-slate-100/60 shadow-sm max-w-xs sm:max-w-md">
                  IMG - {category} - equipo solicitado
                </div>
              </div>
            )}

            {/* Section: Descripción */}
            <div className="space-y-4">
              <h2 className="text-lg font-display font-black text-slate-900 tracking-tight">Descripción</h2>
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed font-medium">
                {descriptionParagraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>





            {/* Testimonials (Optional, rendered below timeline if present) */}
            {testimonios.length > 0 && (
              <div className="space-y-4 pt-4">
                <h2 className="text-lg font-display font-black text-slate-900 tracking-tight">Testimonios de profesionales</h2>
                <div className="space-y-6">
                  {testimonios.map((t, i) => (
                    <blockquote key={i} className="border-l-4 border-slate-350 pl-5 py-1.5 space-y-2.5">
                      <p className="text-slate-600 text-sm leading-relaxed italic font-medium">"{t.texto}"</p>
                      <footer className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="text-slate-700 font-bold">— {t.autor}</span>
                        {t.fecha && (
                          <>
                            <span className="text-slate-200 font-normal">·</span>
                            <span className="font-normal normal-case">{new Date(t.fecha).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</span>
                          </>
                        )}
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="lg:col-span-1 space-y-6">
            {/* Donation/Progress Widget */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
              
              {/* Amounts & Percentage */}
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[20px] font-black text-slate-900 tracking-tight">
                  {formatter.format(campaign.monto_actual)}{' '}
                  <span className="text-sm font-medium text-slate-400">/ {formatter.format(campaign.monto_objetivo)}</span>
                </span>
                <span className={`text-sm font-black ${isUrgent ? 'text-[#dc2626]' : 'text-slate-800'}`}>
                  {pct}%
                </span>
              </div>

              {/* Red flat progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-emerald-600"
                  style={{
                    width: `${pct}%`
                  }}
                />
              </div>

              {/* Time Remaining with Dot */}
              {daysLeft !== null && !isComplete && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#dc2626] mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#dc2626] shrink-0" />
                  <span>Quedan {daysLeft} días</span>
                </div>
              )}

              <hr className="border-slate-100 my-4" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <div className="text-2xl font-black text-slate-900">{donorCount}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Personas donaron</div>
                </div>
                <div>
                  <div className={`text-2xl font-black ${isUrgent ? 'text-[#dc2626]' : 'text-slate-900'}`}>
                    {daysLeft !== null ? daysLeft : '12'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Días restantes</div>
                </div>
              </div>

              <hr className="border-slate-100 my-4" />

              {/* CTA Buttons */}
              <div className="space-y-2.5 pt-2">
                {!isComplete ? (
                  <button
                    onClick={() => setShowDonationModal(true)}
                    className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-all shadow-sm hover:shadow-md"
                  >
                    <Heart className="h-4 w-4" />
                    Donar a esta campaña
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm">
                    <CheckCircle className="h-4 w-4" />
                    ¡Meta alcanzada!
                  </div>
                )}

                <button
                  onClick={handleShare}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors"
                >
                  Compartir campaña
                </button>
              </div>

              {/* Secure Payment box */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex items-start gap-2.5 text-[10px] text-slate-500 mt-4 leading-normal">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Pago seguro vía Mercado Pago o Transferencia. Comprobante legal automático.</span>
              </div>
            </div>

            {/* Section: Últimos Donantes */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
              <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                Últimos donantes
              </h3>
              {donantes.length > 0 ? (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                  {donantes.map((d, i) => (
                    <DonanteItem key={i} {...d} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-xs font-semibold text-slate-600">¡Aún no hay donaciones aprobadas!</p>
                  <p className="text-[10px] text-slate-500 mt-1">Sé el primero en colaborar con esta campaña.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal de donación ── */}
      {showDonationModal && (
        <DonationModal
          campaign={campaign}
          onClose={() => setShowDonationModal(false)}
          onSuccess={() => {
            // Refrescar datos de la campaña tras donar
            api.get(`/campanas/${id}`).then(r => setCampaign(r.data)).catch(() => {});
          }}
        />
      )}

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={window.location.href}
        title={campaign?.titulo || ''}
        summary="¡Sumate a colaborar! Campaña para la Cooperadora del Hospital Emilio Ferreyra."
        imageUrl={campaign?.detalles?.galeria_rica?.imagenes?.[0] || campaign?.detalles?.equipamiento_imagen || ''}
        shareMessage={`¡Hola! Te invito a sumarte y colaborar con la campaña: "${campaign?.titulo || ''}" de la Cooperadora del Hospital Emilio Ferreyra.`}
      />
    </div>
  );
};

export default CampaignDetail;
