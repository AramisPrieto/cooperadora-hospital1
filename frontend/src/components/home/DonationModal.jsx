import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import FileUpload from '../FileUpload';
import {
  Sparkles, X, Info, CheckCircle, AlertCircle, Banknote,
  Heart, Copy, Check
} from 'lucide-react';

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const DonationModal = ({ selectedCampaign, onClose, onDonationSuccess }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [donationMethod, setDonationMethod] = useState('transferencia');
  const [customDonationAmount, setCustomDonationAmount] = useState('5000');
  const [transferenciaMonto, setTransferenciaMonto] = useState('5000');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [donationError, setDonationError] = useState('');
  const [donationSuccess, setDonationSuccess] = useState('');

  if (!selectedCampaign) return null;

  if (!user) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center space-y-5 animate-fade-up">
          <div className="h-16 w-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-brand-600 fill-brand-200" />
          </div>
          <h3 className="text-xl font-display font-black text-slate-900">Iniciar sesión para donar</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Necesitás una cuenta para realizar tu donación y recibir el comprobante legal de tu aporte.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full btn-brand py-3 text-sm justify-center"
          >
            Iniciar sesión
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 text-sm hover:text-slate-600 transition-colors block w-full"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  const modalPct = Math.min(
    100,
    Math.round(
      (parseFloat(selectedCampaign.monto_actual || 0) /
        parseFloat(selectedCampaign.monto_objetivo || 1)) *
        100
    )
  );

  const handleMpDonation = async (amount) => {
    if (!amount || isNaN(amount) || parseFloat(amount) < 1000) {
      setDonationError('El monto mínimo para donar es $1.000.');
      return;
    }
    setSubmittingDonation(true);
    setDonationError('');
    try {
      const res = await api.post(`/donaciones/campanas/${selectedCampaign.id}/donar-mp`, {
        monto: parseFloat(amount),
        frontend_url: window.location.origin
      });
      const checkoutUrl = res.data.sandboxInitPoint || res.data.initPoint;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setDonationError('No se pudo obtener la URL de redirección de Mercado Pago.');
        setSubmittingDonation(false);
      }
    } catch (err) {
      setDonationError(err.response?.data?.error || 'Error al conectar con la pasarela de Mercado Pago.');
      setSubmittingDonation(false);
    }
  };

  const handleDeclareTransfer = async (e) => {
    e.preventDefault();
    if (!transferenciaMonto || isNaN(transferenciaMonto) || parseFloat(transferenciaMonto) < 1000) {
      setDonationError('El monto mínimo para donar es $1.000.');
      return;
    }
    setSubmittingDonation(true);
    setDonationError('');
    try {
      await api.post(`/donaciones/campanas/${selectedCampaign.id}/donar-transferencia`, {
        monto: parseFloat(transferenciaMonto),
        numero_comprobante: numeroComprobante.trim(),
        comprobante_url: comprobanteUrl
      });
      setDonationSuccess(
        '¡Tu comprobante ha sido registrado con éxito! Nuestro equipo administrativo validará la transferencia para actualizar los fondos de la campaña.'
      );
      if (onDonationSuccess) onDonationSuccess();
    } catch (err) {
      setDonationError(err.response?.data?.error || 'Error al registrar la transferencia.');
    } finally {
      setSubmittingDonation(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl sm:max-w-2xl md:max-w-3xl shadow-dark-lg overflow-hidden sm:border sm:border-slate-100 animate-slide-down sm:animate-fade-up max-h-[92dvh] sm:max-h-[90vh] flex flex-col pb-safe sm:pb-0">
        {/* Modal header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="badge badge-red">
                <Sparkles className="h-3 w-3" />
                Campaña en Curso
              </span>
              <h3 className="text-2xl font-display font-black text-slate-900 leading-tight">
                {selectedCampaign.titulo}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 h-8 w-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content wrapper */}
        <div className="overflow-y-auto flex-grow" data-lenis-prevent>
          <div className="p-6 space-y-5">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-brand-400 rounded-full inline-block" />
                Información de Recaudación
                <span className="h-0.5 w-4 bg-brand-400 rounded-full inline-block" />
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">
                    Meta Económica
                  </span>
                  <span className="text-xl font-display font-black text-slate-800">
                    {formatter.format(selectedCampaign.monto_objetivo)}
                  </span>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <span className="block text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-1">
                    Recaudación Real
                  </span>
                  <span className="text-xl font-display font-black text-emerald-700">
                    {formatter.format(selectedCampaign.monto_actual)}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Progreso colectivo</span>
                  <span className="text-emerald-600">{modalPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative shadow-inner">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${modalPct}%` }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] w-full translate-x-[-100%] animate-[shimmer_2.5s_infinite]" />
                </div>
              </div>
            </div>

            {/* Información del Equipo Médico */}
            {selectedCampaign.detalles?.equipamiento_info && (
              <div className="mt-5 border-t border-slate-100 pt-4 space-y-3">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-teal-600" />
                  Equipo Médico a Adquirir
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-teal-50/20 rounded-2xl p-4 border border-teal-100/80 shadow-sm hover:shadow-md transition-shadow group">
                  {selectedCampaign.detalles.equipamiento_imagen && (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-white sm:col-span-1 shadow-inner relative">
                      <img
                        src={selectedCampaign.detalles.equipamiento_imagen}
                        alt={`Imagen de ${selectedCampaign.titulo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div
                    className={
                      selectedCampaign.detalles.equipamiento_imagen
                        ? 'sm:col-span-2 space-y-1.5'
                        : 'sm:col-span-3 space-y-1.5'
                    }
                  >
                    <span className="inline-block text-[9px] text-teal-700 font-black uppercase tracking-wider bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
                      Especificación Técnica
                    </span>
                    <p className="text-xs font-black text-slate-800 leading-tight">
                      Equipo: {selectedCampaign.titulo}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      {selectedCampaign.detalles.equipamiento_info}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Donation Action Footer */}
          <div className="border-t border-slate-100 bg-slate-50 p-6 space-y-4">
            {donationSuccess ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium p-4 rounded-2xl shadow-sm">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <p className="leading-normal">{donationSuccess}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full btn-brand py-3 text-sm justify-center"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                {donationError && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3.5 rounded-xl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {donationError}
                  </div>
                )}

                {/* Method selector */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setDonationMethod('transferencia')}
                    className={`flex-1 text-xs py-2 px-3 rounded-xl font-bold uppercase tracking-wider border transition-all ${
                      donationMethod === 'transferencia'
                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="h-3.5 w-3.5 inline mr-1.5" />
                    CBU / Transferencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonationMethod('mp')}
                    className={`flex-1 text-xs py-2 px-3 rounded-xl font-bold uppercase tracking-wider border transition-all ${
                      donationMethod === 'mp'
                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Heart className="h-3.5 w-3.5 inline mr-1.5" />
                    Mercado Pago
                  </button>
                </div>

                {donationMethod === 'transferencia' ? (
                  <form onSubmit={handleDeclareTransfer} className="space-y-4">
                    {/* Bank account details */}
                    <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-3 text-xs shadow-sm">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-medium">Entidad bancaria:</span>
                        <span className="text-slate-800 font-black">Banco Provincia</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-medium">Razón Social:</span>
                        <span className="text-slate-800 font-black">Asoc. Cooperadora Hosp. Ferreyra</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400 font-medium">CUIT:</span>
                        <span className="text-slate-800 font-black">30-67891234-5</span>
                      </div>

                      {/* Alias */}
                      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
                        <span className="text-slate-400 font-medium">Alias:</span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('cooperadora.hospital.nec');
                              setCopiedAlias(true);
                              setTimeout(() => setCopiedAlias(false), 2000);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 text-slate-800 transition-all text-xs"
                            title="Copiar Alias"
                          >
                            <span className="font-mono font-bold select-all">cooperadora.hospital.nec</span>
                            {copiedAlias ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* CBU */}
                      <div className="flex items-center justify-between gap-2 sm:gap-4 pt-1 flex-wrap">
                        <span className="text-slate-400 font-medium">CBU:</span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('0140354701354701354701');
                              setCopiedCbu(true);
                              setTimeout(() => setCopiedCbu(false), 2000);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 text-slate-800 transition-all text-xs"
                            title="Copiar CBU"
                          >
                            <span className="font-mono font-bold select-all">0140354701354701354701</span>
                            {copiedCbu ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider">
                            Monto transferido ($) *
                          </label>
                          <span className="text-[10px] text-slate-400 font-bold">Mínimo $1.000</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          {[2000, 5000, 10000, 20000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setTransferenciaMonto(String(amt))}
                              className={`py-1.5 px-2 rounded-xl text-xs font-black border transition-all ${
                                transferenciaMonto === String(amt)
                                  ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              ${amt.toLocaleString('es-AR')}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="1000"
                          value={transferenciaMonto}
                          onChange={(e) => setTransferenciaMonto(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                          N° Comprobante / Transacción (opcional)
                        </label>
                        <input
                          type="text"
                          value={numeroComprobante}
                          onChange={(e) => setNumeroComprobante(e.target.value)}
                          placeholder="Ej: TRX-9821873"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    {/* Comprobante upload */}
                    <FileUpload
                      tipo="comprobante"
                      value={comprobanteUrl}
                      onChange={setComprobanteUrl}
                      label="Adjuntar Comprobante (Opcional)"
                    />

                    <button
                      type="submit"
                      disabled={submittingDonation}
                      className="w-full btn-brand py-3 text-sm justify-center shadow-lg font-black uppercase tracking-wider disabled:opacity-50"
                    >
                      {submittingDonation ? 'Registrando...' : 'Declarar Transferencia'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Selecciona un monto sugerido o escribe el valor con el que deseas contribuir:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[2000, 5000, 10000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCustomDonationAmount(String(amt))}
                          className={`py-2 px-3 rounded-xl font-black text-xs border transition-all ${
                            customDonationAmount === String(amt)
                              ? 'bg-brand-50 border-brand-500 text-brand-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          ${amt.toLocaleString('es-AR')}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1.5">
                        Monto personalizado ($)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="1000"
                        value={customDonationAmount}
                        onChange={(e) => setCustomDonationAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMpDonation(parseFloat(customDonationAmount))}
                      disabled={submittingDonation || !customDonationAmount || parseFloat(customDonationAmount) < 1000}
                      className="w-full btn-brand py-3 text-sm justify-center shadow-lg font-black uppercase tracking-wider disabled:opacity-50"
                    >
                      {submittingDonation ? 'Conectando con MP...' : `Donar $${parseFloat(customDonationAmount || 0).toLocaleString('es-AR')} con Mercado Pago`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DonationModal;
