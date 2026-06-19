import React, { useState } from 'react';
import { CreditCard, CheckCircle, Clock, XCircle, Check, ArrowRight, Copy, Banknote, Info } from 'lucide-react';
import FileUpload from '../FileUpload';

const CuotasTab = ({
  profile,
  cuotas,
  payments,
  onSubscribeMP,
  onCancelSubMP,
  onDeclareTransfer,
  onChangeMethod,
  submittingSub,
  submittingTransfer
}) => {
  // Local states for Mercado Pago subscription input
  const [subMonto, setSubMonto] = useState('2000');
  
  // Local states for Manual Transfer
  const [transferMonto, setTransferMonto] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [transferReceiptUrl, setTransferReceiptUrl] = useState('');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);

  // Computations
  const periodicCuotas = (cuotas || []).filter(c => c.mes !== null && c.mes !== undefined && c.anio !== null && c.anio !== undefined);
  const cuotasPagas = periodicCuotas.filter(c => c.estado === 'pagado').length;
  const cuotasPendientes = periodicCuotas.filter(c => c.estado === 'pendiente').length;

  const actualPayments = (payments || []).filter(p => p.fecha_pago !== null || p.metodo_pago !== null);

  const handleSubSubmit = (e) => {
    e.preventDefault();
    const parsedMonto = parseFloat(subMonto);
    onSubscribeMP(isNaN(parsedMonto) ? 0 : parsedMonto);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const parsedMonto = parseFloat(transferMonto);
    onDeclareTransfer({
      monto: isNaN(parsedMonto) ? 0 : parsedMonto,
      numero_comprobante: (transferNumber || '').trim(),
      comprobante_url: (transferReceiptUrl || '').trim()
    }).then(() => {
      // Clear local inputs on success
      setTransferMonto('');
      setTransferNumber('');
      setTransferReceiptUrl('');
    }).catch(() => {});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-up">
      
      {/* COL IZQUIERDA: HISTORIAL DE PERÍODOS Y HISTORIAL DE TRANSACCIONES */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Card 1: Estado de Aportes por Período */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-600" />
                Historial de Cuotas Sociales
              </h2>
              <p className="text-xs text-slate-500 mt-1">Estado de tus aportaciones por período mensual de facturación.</p>
            </div>
            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl">Pendientes: {cuotasPendientes}</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">Pagas: {cuotasPagas}</span>
            </div>
          </div>

          {periodicCuotas.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-semibold">No se encontraron registros de cuotas emitidas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Período</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4">Fecha Pago</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodicCuotas.map(cuota => {
                    const fechaObj = new Date(cuota.anio, cuota.mes - 1, 1);
                    const periodoStr = fechaObj.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                    return (
                      <tr key={cuota.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-700 capitalize">{periodoStr}</td>
                        <td className="p-4 text-right font-black text-slate-800">
                          ${parseFloat(cuota.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-slate-400 font-medium">
                          {cuota.fecha_pago
                            ? new Date(cuota.fecha_pago).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'
                          }
                        </td>
                        <td className="p-4">
                          {cuota.estado === 'pagado' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <CheckCircle className="h-3 w-3" /> Pagada
                            </span>
                          ) : cuota.estado === 'pendiente' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <Clock className="h-3 w-3" /> Pendiente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <XCircle className="h-3 w-3" /> Vencida
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

        {/* Card 2: Historial de Transacciones */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-600" />
              Historial de Transacciones Procesadas
            </h2>
            <p className="text-xs text-slate-500 mt-1">Registro y estado de cada pago declarado o procesado de forma automática.</p>
          </div>

          {actualPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Banknote className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No se registran transacciones de cuotas aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Fecha</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4">Método</th>
                    <th className="p-4">Comprobante / ID</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actualPayments.map(pago => (
                    <tr key={pago.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        {pago.fecha_pago
                          ? new Date(pago.fecha_pago).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'
                        }
                      </td>
                      <td className="p-4 text-right font-black text-slate-800">
                        ${parseFloat(pago.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 uppercase font-bold text-slate-500">
                        {pago.metodo_pago === 'debito' ? 'Débito MP' : pago.metodo_pago}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-slate-400">
                        {pago.mp_payment_id || pago.numero_comprobante || 'N/A'}
                      </td>
                      <td className="p-4">
                        {pago.estado === 'aprobado' || pago.estado === 'pagado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                            <CheckCircle className="h-3 w-3" /> Aprobado
                          </span>
                        ) : pago.estado === 'pendiente' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">
                            <Clock className="h-3 w-3 animate-pulse" /> Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase">
                            <XCircle className="h-3 w-3" /> Rechazado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* COL DERECHA: SELECCIÓN DE MÉTODO DE PAGO Y FORMULARIOS DE PAGO */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Selector y configuración de método de pago */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-display font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="h-5 w-5 text-brand-600" />
            Medio de Pago Preferido
          </h2>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-500">Seleccioná cómo preferís abonar tu cuota social:</p>
            <div className="flex gap-2">
              {['debito', 'transferencia', 'cobrador'].map((method) => {
                const currentMonth = new Date().toISOString().substring(0, 7);
                const cantCambios = profile?.mes_ultimo_cambio_metodo_pago === currentMonth 
                  ? (profile?.cant_cambios_metodo_pago || 0) 
                  : 0;
                const reachedLimit = cantCambios >= 3;
                const isSelected = profile?.metodo_pago === method;
                const isDebitoAuthorized = method === 'debito' && profile?.mp_subscription_status === 'authorized';
                const isDisabled = isDebitoAuthorized || (!isSelected && reachedLimit);

                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      if (isDebitoAuthorized) return;
                      onChangeMethod(method);
                    }}
                    className={`flex-grow text-xs px-2.5 py-2 rounded-xl font-black uppercase tracking-wider border transition-all ${
                      isSelected
                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                    disabled={isDisabled}
                  >
                    {method === 'debito' ? 'Débito MP' : method === 'transferencia' ? 'CBU / Alias' : 'Cobrador'}
                  </button>
                );
              })}
            </div>

            {/* Mensaje informativo sobre el límite de cambios de método de pago */}
            {(() => {
              const currentMonth = new Date().toISOString().substring(0, 7);
              const cantCambios = profile?.mes_ultimo_cambio_metodo_pago === currentMonth 
                ? (profile?.cant_cambios_metodo_pago || 0) 
                : 0;
              const cambiosRestantes = Math.max(0, 3 - cantCambios);
              const mesesMap = {
                '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril',
                '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto',
                '09': 'septiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre'
              };
              const mesActualNombre = mesesMap[currentMonth.substring(5, 7)] || 'este mes';

              return (
                <div className="mt-1 flex items-start gap-2 p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                  <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-bold">Límite de cambios:</span> Podés cambiar tu método de pago hasta 3 veces por mes. 
                    {cambiosRestantes > 0 ? (
                      <span> Te quedan <strong className="font-black text-amber-900">{cambiosRestantes}</strong> {cambiosRestantes === 1 ? 'cambio disponible' : 'cambios disponibles'} en {mesActualNombre}.</span>
                    ) : (
                      <span className="text-rose-700 font-bold block mt-1">Ya alcanzaste el límite de 3 cambios en {mesActualNombre}. No podés realizar más cambios hasta el mes siguiente.</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Débito automático (Mercado Pago) */}
          {profile?.metodo_pago === 'debito' && (
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Suscripción Mercado Pago</h4>
                  <p className="text-[10px] text-slate-500">Débito automático mensual de tu cuota.</p>
                </div>
              </div>

              {profile.mp_subscription_status === 'authorized' ? (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Estado de suscripción:</span>
                    <span className="text-emerald-600 font-black uppercase text-[10px] flex items-center gap-1">
                      <Check className="h-3 w-3" /> Activa
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Monto mensual aportado:</span>
                    <span className="text-slate-950 font-black">${parseFloat(profile.monto_cuota).toLocaleString('es-AR')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onCancelSubMP}
                    className="w-full btn-outline text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 py-2 justify-center text-xs mt-2"
                  >
                    Cancelar Débito Automático
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <label className="block font-bold text-slate-600">
                      Elegí el monto del aporte mensual ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                      <input
                        type="number"
                        min="2000"
                        value={subMonto}
                        onChange={(e) => setSubMonto(e.target.value)}
                        className="input-field pl-7 py-2 text-xs"
                        required
                        disabled={submittingSub}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal leading-relaxed">
                      El monto mínimo es de $2000 ARS. Podés ingresar un monto mayor si deseás colaborar más.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingSub}
                    className="w-full btn-brand py-2.5 text-xs justify-center uppercase tracking-wider font-bold"
                  >
                    <CreditCard className="h-3.5 w-3.5 animate-pulse" />
                    {submittingSub ? 'Redirigiendo...' : 'Adherirme a Débito Automático'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Transferencia bancaria */}
          {profile?.metodo_pago === 'transferencia' && (
            <div className="space-y-4">
              {/* CBU/Alias Box */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-[11px] shadow-sm">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Banco:</span>
                  <span className="text-slate-800 font-bold">Banco Provincia</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Titular:</span>
                  <span className="text-slate-800 font-bold">Asoc. Cooperadora Hosp. Ferreyra</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Alias:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">cooperadora.hospital.nec</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('cooperadora.hospital.nec');
                        setCopiedAlias(true);
                        setTimeout(() => setCopiedAlias(false), 2000);
                      }}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors flex items-center justify-center"
                    >
                      {copiedAlias ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CBU:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">0140354701354701354701</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('0140354701354701354701');
                        setCopiedCbu(true);
                        setTimeout(() => setCopiedCbu(false), 2000);
                      }}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors flex items-center justify-center"
                    >
                      {copiedCbu ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Declarar pago de cuota */}
              <form onSubmit={handleTransferSubmit} className="bg-white p-4 border border-slate-200 rounded-2xl space-y-3.5 shadow-sm">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  Declarar Transferencia de Cuota
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">
                      Monto transferido ($) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs pointer-events-none">$</span>
                      <input
                        type="number"
                        min="2000"
                        value={transferMonto}
                        onChange={(e) => setTransferMonto(e.target.value)}
                        placeholder="2000"
                        className="input-field pl-7 py-2 text-xs"
                        required
                        disabled={submittingTransfer}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase">
                      Nº Transacción / Comprobante
                    </label>
                    <input
                      type="text"
                      value={transferNumber}
                      onChange={(e) => setTransferNumber(e.target.value)}
                      placeholder="Ej: TXN-54321"
                      className="input-field py-2 text-xs"
                      disabled={submittingTransfer}
                    />
                  </div>

                  <div className="space-y-1">
                    <FileUpload
                      tipo="comprobante"
                      value={transferReceiptUrl}
                      onChange={setTransferReceiptUrl}
                      label="Comprobante de Transferencia"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingTransfer}
                  className="w-full btn-brand py-2 text-xs justify-center mt-2 uppercase tracking-wider font-bold"
                >
                  {submittingTransfer ? 'Registrando...' : 'Declarar Pago'}
                </button>
              </form>
            </div>
          )}

          {/* Cobrador a domicilio */}
          {profile?.metodo_pago === 'cobrador' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
              <p className="text-slate-600 font-medium leading-relaxed">
                Has seleccionado el cobro a través de un cobrador a domicilio. El cobrador pasará por tu domicilio registrado a principios de cada mes.
              </p>
              <p className="text-slate-400 text-[10px] leading-normal">
                Por favor, asegurate de que tu domicilio y tu teléfono de contacto en la pestaña <strong>Mi Resumen</strong> estén actualizados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CuotasTab;
