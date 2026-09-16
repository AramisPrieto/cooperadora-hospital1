import React from 'react';
import { Heart, Users, Target, Newspaper } from 'lucide-react';

export const StatItem = ({ value, label, icon: Icon, color }) => (
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

export const StatsSection = ({ totalRecaudado, totalSocios, totalCampanas, totalNoticias }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem
          value={totalRecaudado}
          label="Recaudado en Obras"
          icon={Heart}
          color="bg-brand-500"
        />
        <StatItem
          value={totalSocios}
          label="Socios Activos"
          icon={Users}
          color="bg-amber-500"
        />
        <StatItem
          value={totalCampanas}
          label="Campañas Médicas"
          icon={Target}
          color="bg-emerald-500"
        />
        <StatItem
          value={totalNoticias}
          label="Novedades y Obras"
          icon={Newspaper}
          color="bg-indigo-500"
        />
      </div>
    </div>
  );
};
export default StatsSection;
