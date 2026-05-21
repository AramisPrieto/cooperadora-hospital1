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
  const [rol, setRol] = useState('socio'); // socio o admin

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
          setTimeout(() => window.location.reload(), 100);
        } else {
          navigate('/');
        }
      } else {
        // Enviar Registro (Cero Anonimato, requiere DNI para socios)
        const payload = {
          email,
          password,
          rol,
          dni: rol === 'socio' ? parseInt(dni) : null
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
    <div class="flex-grow flex items-center justify-center bg-slate-100 py-16 px-4">
      <div class="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/60 p-8 space-y-6 relative overflow-hidden">
        
        {/* Top brand styling */}
        <div class="text-center space-y-2">
          <div class="h-12 w-12 bg-accent-red rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
            <Heart class="h-6 w-6 text-white fill-white" />
          </div>
          <h2 class="text-2xl font-black text-slate-800 tracking-tight">
            {isLogin ? 'Ingresar a la Cooperadora' : 'Crear Cuenta de Socio'}
          </h2>
          <p class="text-xs text-slate-500 max-w-[280px] mx-auto">
            {isLogin 
              ? 'Identifíquese con sus credenciales para acceder a la autogestión.' 
              : 'Únase al Libro Registro de Asociados del Hospital Emilio Ferreyra.'}
          </p>
        </div>

        {/* Warnings / Success alerts */}
        {expired && (
          <div class="flex items-center gap-2 p-3.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs font-semibold">
            <ShieldAlert class="h-4 w-4 shrink-0" />
            Su sesión ha expirado. Por favor, vuelva a ingresar.
          </div>
        )}
        {errorMsg && (
          <div class="flex items-center gap-2 p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-semibold">
            <ShieldAlert class="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div class="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold">
            <Award class="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña</label>
            <div class="relative">
              <Lock class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Dynamic Registration Fields */}
          {!isLogin && (
            <div class="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Cuenta</label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRol('socio')}
                    class={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      rol === 'socio'
                        ? 'bg-teal-50 border-teal-500 text-teal-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Socio / Colaborador
                  </button>
                  <button
                    type="button"
                    onClick={() => setRol('admin')}
                    class={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      rol === 'admin'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Administrativo
                  </button>
                </div>
              </div>

              {rol === 'socio' && (
                <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">DNI (Obligatorio para Socios)</label>
                  <div class="relative">
                    <User class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      required
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      placeholder="DNI sin puntos"
                      class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            class="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs uppercase font-bold tracking-wider shadow-lg shadow-teal-900/10 transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? 'Cargando...' : isLogin ? 'Ingresar' : 'Registrar Cuenta'}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div class="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            class="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-wider"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya posees una cuenta? Inicia Sesión'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
