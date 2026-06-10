import React from 'react';
import PropTypes from 'prop-types';
import { Target, TrendingUp, Calendar, ArrowRight, Clock } from 'lucide-react';

/* Paleta de gradientes para el header de la card */
const CARD_GRADIENTS = [
  'from-teal-500 via-brand-500 to-emerald-600',
  'from-blue-500 via-indigo-500 to-blue-700',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-rose-500 via-pink-500 to-red-600',
  'from-amber-400 via-orange-500 to-red-500',
  'from-cyan-500 via-teal-500 to-brand-600',
];

const getDaysLeft = (fechaLimite) => {
  if (!fechaLimite) return null;
  const diff = new Date(fechaLimite) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const CampaignCard = ({ campaign, onClickDetail }) => {
  const { id, titulo, monto_objetivo, monto_actual, fecha_limite } = campaign;

  const percentage = Math.min(Math.round((parseFloat(monto_actual) / parseFloat(monto_objetivo)) * 100), 100);
  const daysLeft = getDaysLeft(fecha_limite);
  const gradientClass = CARD_GRADIENTS[id % CARD_GRADIENTS.length] ?? CARD_GRADIENTS[0];

  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full border border-slate-100">

      {/* ── Gradient Header ── */}
      <div className={`relative h-28 bg-gradient-to-br ${gradientClass} overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 h-24 w-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 bg-black/10 rounded-full" />
        <div className="absolute top-4 left-5 right-5">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
            <Target className="h-3 w-3" />
            Campaña Activa
          </div>
          {daysLeft !== null && (
            <div className="absolute right-0 top-0 flex items-center gap-1 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-[10px] font-bold">
              <Clock className="h-3 w-3" />
              {daysLeft > 0 ? `${daysLeft}d` : 'Hoy'}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col flex-grow gap-4">

        {/* Title */}
        <h3 className="text-base font-display font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-brand-700 transition-colors min-h-[2.8rem]">
          {titulo}
        </h3>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Meta</span>
            <span className="text-sm font-black text-slate-700">{formatter.format(monto_objetivo)}</span>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <span className="block text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-0.5">Recaudado</span>
            <span className="text-sm font-black text-emerald-700">{formatter.format(monto_actual)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2 mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Progreso</span>
            <span className="text-sm font-black text-brand-600">{percentage}%</span>
          </div>
          <div className="progress-bar h-2.5">
            <div
              className="progress-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium">
              {fecha_limite
                ? new Date(fecha_limite).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Permanente'}
            </span>
          </div>

          <button
            onClick={() => onClickDetail(id)}
            aria-label={`Ver más detalles sobre la campaña: ${titulo}`}
            className="flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 hover:text-brand-800 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-brand-200/50 hover:border-brand-300 transition-all duration-200 group/btn"
          >
            Ver más
            <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

CampaignCard.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.number.isRequired,
    titulo: PropTypes.string.isRequired,
    monto_objetivo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    monto_actual: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    fecha_limite: PropTypes.string
  }).isRequired,
  onClickDetail: PropTypes.func.isRequired
};

export default CampaignCard;
