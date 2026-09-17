import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CheckCircle, Clock, XCircle } from 'lucide-react';

const DonacionesTab = ({ donaciones }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fade-up">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-brand-600" />
          Mis Donaciones a Campañas
        </h2>
        <p className="text-xs text-slate-500 mt-1">Historial y estado de tus colaboraciones monetarias destinadas a las campañas del hospital.</p>
      </div>

      {donaciones.length === 0 ? (
        <div className="text-center py-12">
          <Banknote className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-semibold">Aún no realizaste ninguna donación a campañas.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-brand mt-4 px-5 py-2.5 text-xs inline-flex"
          >
            Ir a Campañas para Donar
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">Campaña de Recaudación</th>
                <th className="p-4">Método</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {donaciones.map(don => {
                const isMp = don.metodo === 'mercadopago' || don.metodo === 'mp' || Boolean(don.mp_payment_id);
                return (
                  <tr key={don.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-700">{don.campana?.titulo ?? 'Campaña de la Cooperadora'}</td>
                    <td className="p-4">
                      {isMp ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 border border-sky-100 text-sky-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Mercado Pago
                          </span>
                          {don.numero_comprobante && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{don.numero_comprobante}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Transferencia
                          </span>
                          {don.numero_comprobante && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Ref: #{don.numero_comprobante}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">
                      ${parseFloat(don.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-slate-400 font-medium">
                      {new Date(don.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                    {don.estado === 'aprobada' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle className="h-3 w-3" /> Aprobada
                      </span>
                    ) : don.estado === 'pendiente' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <XCircle className="h-3 w-3" /> Rechazada
                      </span>
                    )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DonacionesTab;
