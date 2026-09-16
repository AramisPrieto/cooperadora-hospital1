import React, { useState, useMemo } from 'react';
import { Banknote, Search, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const AdminTransfersTab = ({
  transfers = [],
  loading = false,
  submitting = false,
  onApprove,
  onReject
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState(null);

  const filteredTransfers = useMemo(() => {
    if (!search.trim()) return transfers;
    const match = search.toLowerCase();
    return transfers.filter((tr) => {
      const email = (tr.usuario?.email || '').toLowerCase();
      const nombreSocio = `${tr.usuario?.perfilSocio?.nombre || ''} ${tr.usuario?.perfilSocio?.apellido || ''}`.toLowerCase();
      const dni = String(tr.usuario?.perfilSocio?.dni || '');
      return email.includes(match) || nombreSocio.includes(match) || dni.includes(match);
    });
  }, [transfers, search]);

  const transfersPerPage = 25;
  const totalPages = Math.ceil(filteredTransfers.length / transfersPerPage) || 1;
  const indexOfLastTransfer = currentPage * transfersPerPage;
  const indexOfFirstTransfer = indexOfLastTransfer - transfersPerPage;
  const currentTransfers = filteredTransfers.slice(indexOfFirstTransfer, indexOfLastTransfer);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden animate-fade-up">
      {/* Header with Search */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-slate-800 text-lg flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            Donaciones por Transferencia Bancaria
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestione y apruebe las declaraciones de transferencia de los socios.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-64">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por email, socio o DNI..."
            maxLength={100}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent border-none outline-none text-xs w-full font-semibold text-slate-700"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Cargando transferencias...</div>
      ) : transfers.length === 0 ? (
        <div className="p-12 text-center">
          <Banknote className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-semibold">No hay transferencias registradas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Socio</th>
                <th className="p-4">Campaña</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4">Comprobante</th>
                <th className="p-4">Fecha Reporte</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentTransfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-700">
                      {tr.usuario?.perfilSocio
                        ? `${tr.usuario.perfilSocio.nombre} ${tr.usuario.perfilSocio.apellido}`
                        : tr.usuario?.email ?? '—'}
                    </div>
                    {tr.usuario?.perfilSocio && (
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        DNI: {tr.usuario.perfilSocio.dni} | {tr.usuario.email}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 font-semibold">{tr.campana?.titulo ?? '—'}</td>
                  <td className="p-4 text-right font-black text-slate-800">
                    ${parseFloat(tr.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4">
                    {tr.comprobante_url ? (
                      <button
                        onClick={() => setPreviewUrl(tr.comprobante_url)}
                        className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-bold underline transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Ver ({tr.numero_comprobante || 'N/A'})
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Sin comprobante</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500">
                    {tr.createdAt
                      ? new Date(tr.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        tr.estado === 'aprobada'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : tr.estado === 'rechazada'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      {tr.estado}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {tr.estado === 'pendiente' ? (
                      <div className="inline-flex items-center justify-center gap-2">
                        <button
                          onClick={() => onApprove(tr.id)}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-40"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => onReject(tr.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Mostrando {indexOfFirstTransfer + 1} a {Math.min(indexOfLastTransfer, filteredTransfers.length)} de{' '}
                {filteredTransfers.length} transferencias
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 font-bold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprobante Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display font-black text-slate-800 text-lg mb-4">Comprobante Adjunto</h3>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-100">
              <img src={previewUrl} alt="Comprobante de donación" className="w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminTransfersTab;
