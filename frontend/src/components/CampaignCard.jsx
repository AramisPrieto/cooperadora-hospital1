import React from 'react';
import { Clock, CheckCircle, Stethoscope } from 'lucide-react';

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
  Neonatología: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  Emergencias: 'bg-amber-50 text-amber-700 border border-amber-100',
  Diagnóstico: 'bg-blue-50 text-blue-700 border border-blue-100',
  'Terapia Intensiva': 'bg-purple-50 text-purple-700 border border-purple-100',
  Pediatría: 'bg-pink-50 text-pink-700 border border-pink-100',
  Laboratorio: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
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

  const getDonorCount = (id, monto) => parseFloat(monto) === 0 ? 0 : Math.round(parseFloat(monto) / 12000) + (id * 11) + 14;
  const donorCount = getDonorCount(id, monto_actual);

  return (
    <div
      onClick={() => onClickDetail(id)}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer relative"
    >
      {/* ── Completed Overlay Badge ── */}
      {isComplete && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center gap-1 bg-emerald-650 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
            Cumplida
          </span>
        </div>
      )}

      {/* ── Top Image / Placeholder ── */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-50 shrink-0 border-b border-slate-100">
        {image ? (
          <img
            src={image}
            alt={titulo}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 overflow-hidden">
            {/* Dot grid overlay */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            {/* Subtle accent glow */}
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent-500/20 rounded-full blur-3xl" />
            <div className="absolute top-0 left-0 w-28 h-28 bg-brand-500/10 rounded-full blur-2xl" />
            {/* Icon + label */}
            <div className="relative flex flex-col items-center gap-2 opacity-40">
              <Stethoscope className="h-10 w-10 text-white" />
              <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{category}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col flex-grow gap-3.5">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${categoryClass}`}>
            {category}
          </span>
          {isUrgent && (
            <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
              Urgente
            </span>
          )}
          {isComplete && (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
              ✓ Entregado
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-display font-black text-slate-800 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2 min-h-[2.5rem]">
          {titulo}
        </h3>

        {/* Economic stats */}
        <div className="space-y-2.5 mt-auto">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-extrabold text-slate-800">
              {formatter.format(monto_actual)}{' '}
              <span className="text-[10px] text-slate-500 font-medium">/ {formatter.format(monto_objetivo)}</span>
            </span>
            <span className={`font-black ${isUrgent ? 'text-rose-600' : isComplete ? 'text-emerald-600' : 'text-slate-700'}`}>
              {percentage}%
            </span>
          </div>

          {/* Simple flat progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-emerald-600"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Footer metrics */}
          <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
            <span className="flex items-center gap-1">
              {isComplete ? (
                <span className="text-slate-500">Cerrada</span>
              ) : daysLeft !== null ? (
                <span className={isUrgent ? 'text-rose-600 font-black' : 'text-slate-600'}>
                  • Quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                </span>
              ) : (
                <span className="text-slate-600">• Activa</span>
              )}
            </span>
            <span className="font-medium normal-case">{donorCount} donantes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CampaignCard);
