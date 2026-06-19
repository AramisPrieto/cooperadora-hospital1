import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList
} from 'recharts';
import { AlertCircle } from 'lucide-react';

/* ── Mock Data para Gráficos ── */
const mockRevenueData = [
  { name: 'Ene', ingresos: 400000 },
  { name: 'Feb', ingresos: 300000 },
  { name: 'Mar', ingresos: 550000 },
  { name: 'Abr', ingresos: 450000 },
  { name: 'May', ingresos: 800000 },
  { name: 'Jun', ingresos: 1200000 },
];

const mockPartnersData = [
  { name: 'Ene', nuevos: 12 },
  { name: 'Feb', nuevos: 18 },
  { name: 'Mar', nuevos: 25 },
  { name: 'Abr', nuevos: 20 },
  { name: 'May', nuevos: 40 },
  { name: 'Jun', nuevos: 65 },
];

const DashboardCharts = () => {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico 1 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Evolución de Recaudaciones (Mensual)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip formatter={(value) => `$${value}`} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
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
              <BarChart data={mockPartnersData} margin={{ top: 20 }}>
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
      
      <p className="text-[11px] text-slate-400 text-center mt-4 font-semibold px-4 py-3 bg-slate-100/50 rounded-xl">
        <AlertCircle className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
        Nota: Los gráficos muestran datos de muestra (mock data) de forma demostrativa hasta la integración del historial transaccional en el servidor.
      </p>
    </div>
  );
};

export default React.memo(DashboardCharts);
