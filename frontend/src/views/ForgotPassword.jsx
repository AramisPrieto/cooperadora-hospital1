import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Mail, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(false);
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Por favor ingrese su correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(res.data.message || 'Si el correo está registrado, recibirás las instrucciones en breve.');
      setEmail('');
    } catch (err) {
      console.error('Error al solicitar recuperación de contraseña:', err);
      setErrorMsg(err.response?.data?.error || 'Ocurrió un error. Por favor intente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        
        {/* Enlace de regreso */}
        <div className="text-left">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Volver al Ingreso
          </Link>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center justify-center p-3 bg-brand-50 rounded-2xl text-brand-600 mb-2">
              <KeyRound className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Recuperar Contraseña
            </h2>
            <p className="text-xs text-slate-450 leading-relaxed max-w-[280px] mx-auto font-medium">
              Ingresá tu correo electrónico y te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 border border-red-100 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="input-field pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-brand py-3.5 text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando enlace...
                  </>
                ) : (
                  'Enviar Enlace de Recuperación'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
