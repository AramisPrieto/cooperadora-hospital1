import React, { useState, useMemo } from 'react';
import { CreditCard, Search, CheckCircle, XCircle, Eye, X, ExternalLink } from 'lucide-react';

export const AdminCuotasTab = ({
  cuotas = [],
  loading = false,
  submitting = false,
  onValidateCuota
}) => {
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const filteredCuotas = useMemo(() => {
    if (!search.trim()) return cuotas;
    const match = search.toLowerCase();
    return cuotas.filter((c) => {
      const fullName = `${c.perfilSocio?.nombre || ''} ${c.perfilSocio?.apellido || ''}`.toLowerCase();
      const dni = String(c.perfilSocio?.dni || '');
      return fullName.includes(match) || dni.includes(match);
    });
  }, [cuotas, search]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden animate-fade-up">
      {/* Header with Search */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Gestión de Cuotas Sociales
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Historial y validación de cuotas de los socios.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-64">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por socio o DNI..."
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full font-semibold text-slate-700"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando cuotas...</div>
      ) : cuotas.length === 0 ? (
        <div className="p-12 text-center">
          <CreditCard className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-semibold">No hay cuotas registradas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Socio</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4">Fecha Pago</th>
                <th className="p-4">Método</th>
                <th className="p-4 text-center">Comprobante</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCuotas.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-700">
                      {c.perfilSocio?.nombre} {c.perfilSocio?.apellido}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      DNI: {c.perfilSocio?.dni}
                    </div>
                  </td>
                  <td className="p-4 text-right font-black text-slate-800">
                    ${parseFloat(c.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-slate-600 font-semibold">
                    {c.fecha_pago
                      ? new Date(c.fecha_pago).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td className="p-4 uppercase text-[10px] tracking-wider text-slate-500 font-bold">
                    {c.metodo_pago}
                  </td>
                  <td className="p-4 text-center">
                    {c.comprobante_url ? (
                      <button
                        onClick={() => setPreviewUrl(c.comprobante_url)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                        title="Ver comprobante adjunto"
                      >
                        <Eye className="h-3 w-3 text-slate-500" />
                        Ver
                      </button>
                    ) : c.numero_comprobante ? (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        #{c.numero_comprobante}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[10px] italic">Sin adjunto</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        c.estado === 'aprobado' || c.estado === 'pagado'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : c.estado === 'rechazado'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      {c.estado}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {c.estado === 'pendiente' ? (
                      <div className="inline-flex items-center justify-center gap-2">
                        <button
                          onClick={() => onValidateCuota(c.id, 'aprobado')}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => onValidateCuota(c.id, 'rechazado')}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                        >
                          <XCircle className="h-3 w-3" />
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Procesada</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comprobante Preview Modal */}
      {previewUrl && (() => {
        const isPdf = previewUrl.toLowerCase().includes('.pdf');
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl">
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-between mb-4 pr-10">
                <h3 className="font-display font-black text-slate-800 text-lg">Comprobante de Cuota</h3>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir en nueva pestaña
                </a>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-100 flex items-center justify-center bg-slate-50">
                {isPdf ? (
                  <iframe
                    src={previewUrl}
                    title="Comprobante de Cuota PDF"
                    className="w-full h-[65vh] rounded-xl border-none"
                  />
                ) : (
                  <img src={previewUrl} alt="Comprobante de cuota" className="w-full object-contain max-h-[65vh]" />
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
export default AdminCuotasTab;
