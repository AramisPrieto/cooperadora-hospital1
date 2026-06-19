import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList
} from 'recharts';
import { CheckCircle } from 'lucide-react';

const getLast6Months = () => {
  const months = [];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      name: monthNames[d.getMonth()],
      month: d.getMonth(),
      year: d.getFullYear(),
      ingresos: 0,
      nuevos: 0
    });
  }
  return months;
};

const DashboardCharts = ({ transfers = [], partners = [] }) => {
  
  const chartData = useMemo(() => {
    const monthsData = getLast6Months();
    
    // Procesar transferencias aprobadas
    if (Array.isArray(transfers)) {
      transfers.forEach(tr => {
        if (tr.estado === 'aprobada' && tr.createdAt) {
          const date = new Date(tr.createdAt);
          const m = date.getMonth();
          const y = date.getFullYear();
          
          const match = monthsData.find(item => item.month === m && item.year === y);
          if (match) {
            match.ingresos += parseFloat(tr.monto || 0);
          }
        }
      });
    }
    
    // Procesar nuevos socios registrados (fecha_alta o createdAt)
    if (Array.isArray(partners)) {
      partners.forEach(p => {
        const dateStr = p.fecha_alta || p.createdAt;
        if (dateStr) {
          const date = new Date(dateStr);
          const m = date.getMonth();
          const y = date.getFullYear();
          
          const match = monthsData.find(item => item.month === m && item.year === y);
          if (match) {
            match.nuevos++;
          }
        }
      });
    }
    
    return monthsData;
  }, [transfers, partners]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico 1 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Evolución de Recaudaciones (Mensual)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val.toLocaleString('es-AR')}`} />
                <Tooltip formatter={(value) => `$${parseFloat(value).toLocaleString('es-AR')}`} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="ingresos" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Gráfico 2 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Nuevos Socios Registrados</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#fef2f2' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="nuevos" fill="#dc2626" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="nuevos" position="top" fill="#dc2626" fontSize={12} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <p className="text-[11px] text-emerald-600 text-center mt-4 font-semibold px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
        <CheckCircle className="h-3.5 w-3.5 inline mr-1 -mt-0.5 text-emerald-500" />
        Métricas basadas en datos reales del sistema para los últimos 6 meses.
      </p>
    </div>
  );
};

export default React.memo(DashboardCharts);
