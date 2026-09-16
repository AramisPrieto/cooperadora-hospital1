import React, { useRef, useState, useEffect } from 'react';
import {
  Users, Target, Banknote, CreditCard, LayoutDashboard,
  Newspaper, ChevronLeft, ChevronRight, Shield
} from 'lucide-react';

/* ── Small stat card in header ── */
export const HeaderStat = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="h-4 w-4 text-white" />
    </div>
    <div>
      <p className="text-lg font-display font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  </div>
);

export const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'campaigns', label: 'Campañas', icon: Target },
  { id: 'partners',  label: 'Socios',   icon: Users },
  { id: 'news',      label: 'Noticias', icon: Newspaper },
  { id: 'transfers', label: 'Transferencias', icon: Banknote },
  { id: 'cuotas',    label: 'Cuotas Sociales', icon: CreditCard },
];

export const AdminHeader = ({
  activeTab,
  setActiveTab,
  partnersCount,
  campaignsCount,
  transfersCount,
  cuotasCount,
  loading
}) => {
  const tabsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    const t = setTimeout(checkScroll, 150);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', checkScroll);
    };
  }, [loading]);

  return (
    <div className="mb-8">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-3">
            <Shield className="h-3.5 w-3.5" />
            Panel de Control Administrativo
          </div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
            Gestión Institucional
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administre campañas, socios, donaciones por transferencia y novedades del hospital.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HeaderStat label="Socios" value={partnersCount} icon={Users} color="bg-amber-500" />
          <HeaderStat label="Campañas" value={campaignsCount} icon={Target} color="bg-brand-500" />
          <HeaderStat label="Transferencias" value={transfersCount} icon={Banknote} color="bg-emerald-600" />
          <HeaderStat label="Cuotas" value={cuotasCount} icon={CreditCard} color="bg-indigo-600" />
        </div>
      </div>

      {/* Tabs bar with scroll controls */}
      <div className="relative mt-6">
        {showLeftArrow && (
          <button
            onClick={() => tabsRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
            aria-label="Desplazar pestañas a la izquierda"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 h-8 w-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={tabsRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {showRightArrow && (
          <button
            onClick={() => tabsRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
            aria-label="Desplazar pestañas a la derecha"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 h-8 w-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
export default AdminHeader;
