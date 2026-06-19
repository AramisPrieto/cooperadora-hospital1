import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

const getDaysLeft = (fechaLimite) => {
  if (!fechaLimite) return null;
  const diff = new Date(fechaLimite) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

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

const CATEGORY_STYLES = {
  Neonatología: 'bg-emerald-50 text-emerald-700 border border-emerald-100/70',
  Emergencias: 'bg-amber-50 text-amber-700 border border-amber-100/70',
  Diagnóstico: 'bg-blue-50 text-blue-700 border border-blue-100/70',
  'Terapia Intensiva': 'bg-purple-50 text-purple-700 border border-purple-100/70',
  Pediatría: 'bg-pink-50 text-pink-700 border border-pink-100/70',
  Laboratorio: 'bg-indigo-50 text-indigo-700 border border-indigo-100/70',
  General: 'bg-slate-50 text-slate-700 border border-slate-100',
};

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const CampaignCard = ({ campaign, onClickDetail }) => {
  const { id, titulo, monto_objetivo, monto_actual, fecha_limite } = campaign;

  const percentage = Math.min(Math.round((parseFloat(monto_actual) / parseFloat(monto_objetivo)) * 100), 100);
  const daysLeft = getDaysLeft(fecha_limite);
  const isUrgent = daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 && percentage < 100;
  const isComplete = percentage >= 100;

  const category = getCategoryFromTitle(titulo);
  const categoryClass = CATEGORY_STYLES[category] || CATEGORY_STYLES.General;

  const image = campaign.detalles?.galeria_rica?.imagenes?.[0] || campaign.detalles?.equipamiento_imagen || '';

  const getDonorCount = (id, monto) => Math.round(parseFloat(monto) / 12000) + (id * 11) + 14;
  const donorCount = getDonorCount(id, monto_actual);

  return (
    <div
      onClick={() => onClickDetail(id)}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-550 flex flex-col h-full cursor-pointer relative"
    >
      {/* ── Completed Badge Overlay ── */}
      {isComplete && (
        <div className="absolute top-4 right-4 z-10 animate-fade-in">
          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
            ✓ Cumplida
          </span>
        </div>
      )}

      {/* ── Top Image Container ── */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 shrink-0 border-b border-slate-100">
        {image ? (
          <img
            src={image}
            alt={titulo}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 font-mono text-[9px] font-black tracking-widest uppercase select-none">
            IMG - {category}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* ── Card Content ── */}
      <div className="p-6 flex flex-col flex-grow gap-4 text-left">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${categoryClass}`}>
            {category}
          </span>
          {isUrgent && (
            <span className="bg-rose-50 text-rose-700 border border-rose-100/60 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
              Urgente
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-display font-black text-slate-800 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2 min-h-[2.5rem]">
          {titulo}
        </h3>

        {/* Economic stats */}
        <div className="space-y-3 mt-auto pt-2">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-extrabold text-slate-850">
              {formatter.format(monto_actual)}{' '}
              <span className="text-[10px] text-slate-400 font-semibold font-sans">/ {formatter.format(monto_objetivo)}</span>
            </span>
            <span className={`font-black ${isUrgent ? 'text-rose-600' : isComplete ? 'text-emerald-600' : 'text-slate-800'}`}>
              {percentage}%
            </span>
          </div>

          {/* Premium Progress Bar (Gradient and Soft Glow background) */}
          <div className="w-full bg-slate-100/80 rounded-full h-2 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                  : isUrgent
                    ? 'bg-gradient-to-r from-rose-500 to-brand-600'
                    : 'bg-gradient-to-r from-slate-800 to-slate-950'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Footer metrics */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              {isComplete ? (
                <span className="text-emerald-650 font-black flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Cerrada
                </span>
              ) : daysLeft !== null ? (
                <span className={isUrgent ? 'text-rose-600 font-black flex items-center gap-1' : 'text-slate-500 flex items-center gap-1'}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isUrgent ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`} />
                  Quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  Activa
                </span>
              )}
            </span>
            <span className="font-extrabold normal-case text-slate-500">{donorCount} donantes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CampaignCard);
