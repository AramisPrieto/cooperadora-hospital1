import React, { useState, useMemo } from 'react';
import { CreditCard, Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import ComprobanteModal from './ComprobanteModal.jsx';

export const AdminCuotasTab = ({
  cuotas = [],
  loading = false,
  submitting = false,
  onValidateCuota
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas'); // 'todas' | 'aprobadas' | 'desaprobadas' | 'pendientes'
  const [previewData, setPreviewData] = useState(null);

  const counts = useMemo(() => ({
    todas: cuotas.length,
    aprobadas: cuotas.filter((c) => c.estado === 'aprobado' || c.estado === 'pagado').length,
    desaprobadas: cuotas.filter((c) => c.estado === 'rechazado').length,
    pendientes: cuotas.filter((c) => c.estado === 'pendiente').length
  }), [cuotas]);

  const filteredCuotas = useMemo(() => {
    let result = cuotas;

    if (statusFilter === 'aprobadas') {
      result = result.filter((c) => c.estado === 'aprobado' || c.estado === 'pagado');
    } else if (statusFilter === 'desaprobadas') {
      result = result.filter((c) => c.estado === 'rechazado');
    } else if (statusFilter === 'pendientes') {
      result = result.filter((c) => c.estado === 'pendiente');
    }

    if (search.trim()) {
      const match = search.toLowerCase();
      result = result.filter((c) => {
        const fullName = `${c.perfilSocio?.nombre || ''} ${c.perfilSocio?.apellido || ''}`.toLowerCase();
        const dni = String(c.perfilSocio?.dni || '');
        return fullName.includes(match) || dni.includes(match);
      });
    }

    return result;
  }, [cuotas, statusFilter, search]);

  const getEmptyMessage = () => {
    if (search.trim()) {
      return `No se encontraron cuotas que coincidan con "${search}" en esta vista.`;
    }
    switch (statusFilter) {
      case 'aprobadas':
        return 'No hay cuotas aprobadas registradas.';
      case 'desaprobadas':
        return 'No hay cuotas desaprobadas (rechazadas).';
      case 'pendientes':
        return 'No hay cuotas pendientes de validación.';
      default:
        return 'No hay cuotas registradas.';
    }
  };

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

      {/* Tabs / Vistas de Cuotas */}
      <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('todas')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'todas'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <span>Todas</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              statusFilter === 'todas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {counts.todas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('aprobadas')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'aprobadas'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                statusFilter === 'aprobadas' ? 'bg-white' : 'bg-emerald-500'
              }`}
            />
            Aprobadas
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              statusFilter === 'aprobadas' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {counts.aprobadas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('desaprobadas')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'desaprobadas'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                statusFilter === 'desaprobadas' ? 'bg-white' : 'bg-rose-500'
              }`}
            />
            Desaprobadas
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              statusFilter === 'desaprobadas' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {counts.desaprobadas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pendientes')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            statusFilter === 'pendientes'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200/80'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                statusFilter === 'pendientes' ? 'bg-white' : 'bg-amber-500'
              }`}
            />
            Pendientes
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              statusFilter === 'pendientes' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {counts.pendientes}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando cuotas...</div>
      ) : filteredCuotas.length === 0 ? (
        <div className="p-12 text-center">
          <CreditCard className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-semibold">{getEmptyMessage()}</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredCuotas.map((c) => (
              <div key={c.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {c.perfilSocio?.nombre} {c.perfilSocio?.apellido}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      DNI: {c.perfilSocio?.dni}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                      c.estado === 'aprobado' || c.estado === 'pagado'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : c.estado === 'rechazado'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}
                  >
                    {c.estado}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Monto cuota:</span>
                    <span className="text-sm font-black text-slate-900">
                      ${parseFloat(c.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Fecha de pago:</span>
                    <span className="text-slate-600 font-medium">
                      {c.fecha_pago
                        ? new Date(c.fecha_pago).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Método de pago:</span>
                    <span className="uppercase text-[10px] tracking-wider text-slate-700 font-bold">
                      {c.metodo_pago}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Comprobante:</span>
                    {c.comprobante_url ? (
                      <button
                        onClick={() =>
                          setPreviewData({
                            url: c.comprobante_url,
                            numero: c.numero_comprobante || '',
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-bold underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver archivo
                      </button>
                    ) : c.numero_comprobante ? (
                      <span className="font-mono text-slate-600 text-[10px]">
                        Ref: #{c.numero_comprobante}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Sin comprobante</span>
                    )}
                  </div>
                </div>

                {c.estado === 'pendiente' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onValidateCuota(c.id, 'aprobado')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm min-h-[40px]"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => onValidateCuota(c.id, 'rechazado')}
                      disabled={submitting}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 active:scale-98 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 min-h-[40px]"
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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
                          onClick={() =>
                            setPreviewData({
                              url: c.comprobante_url,
                              numero: c.numero_comprobante || '',
                            })
                          }
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
        </>
      )}

      {/* Comprobante Preview Modal */}
      {previewData && (
        <ComprobanteModal
          url={previewData.url}
          numeroComprobante={previewData.numero}
          title="Comprobante de Cuota"
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
};
export default AdminCuotasTab;
