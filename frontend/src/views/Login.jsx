import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Mail, Lock, User, Heart, ShieldAlert, Award } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados para el login
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Validar si venía de un redireccionamiento expirado
  const expired = searchParams.get('expired');
  const redirectCampaign = searchParams.get('redirect') === 'campana';
  const campaignId = searchParams.get('id');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // Enviar Login
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        setSuccessMsg('¡Sesión iniciada con éxito!');
        
        // Redirigir si venía a ver una campaña
        if (redirectCampaign && campaignId) {
          navigate('/?view=' + campaignId);
        } else {
          navigate('/');
        }
      } else {
        // Enviar Registro (Cero Anonimato, requiere DNI — todos los registros son socios)
        const payload = {
          email,
          password,
          dni: parseInt(dni)
        };
        const res = await api.post('/auth/register', payload);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        setSuccessMsg('¡Registro exitoso! Su perfil ha sido creado.');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Ha ocurrido un error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-slate-100 py-16 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/60 p-8 space-y-6 relative overflow-hidden">
        
        {/* Top brand styling */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-accent-red rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
            <Heart className="h-6 w-6 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {isLogin ? 'Ingresar a la Cooperadora' : 'Crear Cuenta de Socio'}
          </h2>
          <p className="text-xs text-slate-500 max-w-[280px] mx-auto">
            {isLogin 
              ? 'Identifíquese con sus credenciales para acceder a la autogestión.' 
              : 'Únase al Libro Registro de Asociados del Hospital Emilio Ferreyra.'}
          </p>
        </div>

        {/* Warnings / Success alerts */}
        {expired && (
          <div className="flex items-center gap-2 p-3.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs font-semibold">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Su sesión ha expirado. Por favor, vuelva a ingresar.
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-semibold">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold">
            <Award className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Dynamic Registration Fields */}
          {!isLogin && (
            <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">DNI (Obligatorio)</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    required
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="DNI sin puntos"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs uppercase font-bold tracking-wider shadow-lg shadow-teal-900/10 transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? 'Cargando...' : isLogin ? 'Ingresar' : 'Registrar Cuenta'}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-wider"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya posees una cuenta? Inicia Sesión'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
