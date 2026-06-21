import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Validaciones locales
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  useEffect(() => {
    if (!token) {
      setErrorMsg('Token de recuperación ausente o no válido. Por favor solicite un nuevo enlace.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token) {
      setErrorMsg('Token de recuperación ausente. Vuelva a solicitar el enlace.');
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setErrorMsg('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setSuccessMsg(res.data.message || 'Tu contraseña ha sido restablecida con éxito.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error al restablecer contraseña:', err);
      setErrorMsg(err.response?.data?.error || 'Ocurrió un error al restablecer la contraseña. Es posible que el enlace haya expirado.');
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
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Restablecer Contraseña
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto font-medium">
              Por favor ingresá tu nueva contraseña para acceder de nuevo a tu cuenta de socio.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 border border-red-100 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">{successMsg}</span>
                <span className="text-[10px] text-emerald-600 font-medium block">Redireccionando al login en 3 segundos...</span>
              </div>
            </div>
          )}

          {token && !successMsg && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nueva Contraseña */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                >
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="input-field pl-10 pr-11"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Indicadores de requisitos de contraseña */}
                <div className="text-[10px] space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">Requisitos de Seguridad:</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>Al menos 8 caracteres</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${hasUppercase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>Una letra Mayúscula</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>Al menos un Número</span>
                  </div>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                >
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita la nueva contraseña"
                    className="input-field pl-10 pr-11"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                
                {confirmPassword && (
                  <div className="flex items-center gap-1.5 pl-0.5 mt-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${passwordsMatch ? 'text-emerald-700' : 'text-red-600'}`}>
                      {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </span>
                  </div>
                )}
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={loading || !passwordsMatch || !hasMinLength || !hasUppercase || !hasNumber}
                className="w-full btn-brand py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Restableciendo clave...
                  </>
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
