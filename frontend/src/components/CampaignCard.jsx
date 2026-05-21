import React from 'react';
import { Target, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

const CampaignCard = ({ campaign, onClickDetail }) => {
  const { id, titulo, monto_objetivo, monto_actual, fecha_limite } = campaign;
  
  // Calcular porcentaje de recaudación
  const percentage = Math.min(Math.round((monto_actual / monto_objetivo) * 100), 100);
  
  // Formateador de moneda en pesos argentinos
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  });

  return (
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full">
      {/* Visual Header / Decorative Card Top */}
      <div class="bg-gradient-to-r from-teal-500 to-emerald-600 h-2 sm:h-3"></div>
      
      <div class="p-6 flex flex-col flex-grow">
        {/* Title */}
        <h3 class="text-lg font-bold text-slate-800 line-clamp-2 min-h-[3.5rem] group-hover:text-teal-600 transition-colors">
          {titulo}
        </h3>

        {/* Info Icons grid */}
        <div class="grid grid-cols-2 gap-4 my-4 text-xs font-semibold text-slate-500">
          <div class="flex items-center gap-1.5">
            <Target class="h-4 w-4 text-teal-600" />
            <div>
              <span class="block text-[10px] text-slate-400 uppercase">Meta</span>
              <span>{formatter.format(monto_objetivo)}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <TrendingUp class="h-4 w-4 text-emerald-600" />
            <div>
              <span class="block text-[10px] text-slate-400 uppercase">Recaudado</span>
              <span>{formatter.format(monto_actual)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div class="space-y-1.5 mt-auto">
          <div class="flex justify-between items-baseline text-xs font-bold text-slate-700">
            <span>Progreso</span>
            <span class="text-teal-600 text-sm">{percentage}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
            <div 
              class="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Date and Details trigger */}
        <div class="border-t border-slate-100 mt-6 pt-4 flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center gap-1">
            <Calendar class="h-3.5 w-3.5 text-slate-400" />
            <span>
              {fecha_limite 
                ? new Date(fecha_limite).toLocaleDateString('es-AR') 
                : 'Campaña Permanente'}
            </span>
          </div>

          <button 
            onClick={() => onClickDetail(id)}
            class="flex items-center gap-1 font-bold text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-wider text-[11px]"
          >
            Ver más
            <ArrowRight class="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
