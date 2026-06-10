import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Mail, Lock, User, Heart, ShieldAlert, Award, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Nuevos campos de perfil para registro
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [direccion, setDireccion] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [nacionalidad, setNacionalidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('');
  const [metodoPago, setMetodoPago] = useState('');

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
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setSuccessMsg('¡Sesión iniciada con éxito!');
        if (redirectCampaign && campaignId) {
          navigate('/?view=' + campaignId);
        } else {
          navigate('/');
        }
      } else {
        const res = await api.post('/auth/register', {
          email,
          password,
          dni: parseInt(dni),
          nombre: nombre || undefined,
          apellido: apellido || undefined,
          direccion: direccion || undefined,
          localidad: localidad || undefined,
          nacionalidad: nacionalidad || undefined,
          telefono: telefono || undefined,
          fecha_nacimiento: fechaNacimiento || undefined,
          genero: genero || undefined,
          metodo_pago: metodoPago || undefined
        });
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setSuccessMsg('¡Registro exitoso!');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Ha ocurrido un error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    /* Fondo institucional — claro y limpio */
    <div className="flex-grow flex items-center justify-center py-10 pt-28 px-4 relative overflow-hidden bg-slate-50">

      {/* Card —— fondo BLANCO para máxima legibilidad */}
      <div className="relative w-full max-w-md animate-fade-up">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">

          {/* Header de la card */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto bg-brand-50"
              >
                <Heart className="h-7 w-7 text-brand-600 fill-brand-600" />
              </div>
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-black text-slate-900">
                {isLogin ? 'Ingresar' : 'Crear cuenta'}
              </h2>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                {isLogin
                  ? 'Cooperadora del Hospital Municipal Ferreyra'
                  : 'Únase al Libro de Asociados del Hospital Ferreyra'}
              </p>
            </div>
          </div>

          {/* Toggle login / registro */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                isLogin
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                !isLogin
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Alertas */}
          {expired && <Alert color="amber" icon={<ShieldAlert className="h-4 w-4" />}>Sesión expirada. Por favor vuelva a ingresar.</Alert>}
          {errorMsg && <Alert color="rose" icon={<ShieldAlert className="h-4 w-4" />}>{errorMsg}</Alert>}
          {successMsg && <Alert color="emerald" icon={<Award className="h-4 w-4" />}>{successMsg}</Alert>}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="input-field pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* DNI (sólo registro) */}
            {!isLogin && (
              <>
                <div className="space-y-1.5 animate-fade-up">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    DNI <span className="text-red-500 normal-case font-normal">(Obligatorio para socios)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      required
                      value={dni}
                      onChange={e => setDni(e.target.value)}
                      placeholder="Sin puntos ej: 30123456"
                      className="input-field pl-10"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 pl-0.5">
                    <ShieldAlert className="h-3 w-3 text-amber-500 shrink-0" />
                    El DNI queda registrado permanentemente en el Libro de Asociados.
                  </p>
                </div>

                <div className="space-y-4 animate-fade-up border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
                    Completar Datos de Socio
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre *</label>
                      <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apellido *</label>
                      <input type="text" required value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Pérez" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teléfono *</label>
                      <input type="text" required value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="2262550000" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nacionalidad *</label>
                      <input type="text" required value={nacionalidad} onChange={e => setNacionalidad(e.target.value)} placeholder="Argentino" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dirección *</label>
                      <input type="text" required value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle 60 1234" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Localidad *</label>
                      <input type="text" required value={localidad} onChange={e => setLocalidad(e.target.value)} placeholder="Necochea" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">F. Nacimiento *</label>
                      <input type="date" required value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Género *</label>
                      <select required value={genero} onChange={e => setGenero(e.target.value)} className="input-field py-2 text-sm">
                        <option value="">Seleccione...</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Método de Pago Preferido *</label>
                      <select required value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className="input-field py-2 text-sm">
                        <option value="">Seleccione...</option>
                        <option value="transferencia">Transferencia Bancaria</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="cobrador">Cobrador a Domicilio</option>
                        <option value="debito">Débito Automático</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full py-3.5 mt-1 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Procesando...
                </span>
              ) : (
                isLogin ? 'Ingresar a la Cooperadora' : 'Crear cuenta de socio'
              )}
            </button>
          </form>

          {/* Nota de seguridad */}
          <p className="text-center text-xs text-slate-400">
            Acceso protegido de forma <span className="text-brand-600 font-semibold">segura y encriptada</span>. Sin anonimato.
          </p>
        </div>
      </div>
    </div>
  );
};

/* Helper Alert */
const ALERT_STYLES = {
  amber:  'bg-amber-50 border-amber-200 text-amber-800',
  rose:   'bg-red-50 border-red-200 text-red-700',
  emerald:'bg-emerald-50 border-emerald-200 text-emerald-800',
};
const Alert = ({ color, icon, children }) => (
  <div className={`flex items-start gap-2.5 p-3.5 border rounded-xl text-xs font-semibold ${ALERT_STYLES[color]}`}>
    <span className="shrink-0 mt-0.5">{icon}</span>
    <span>{children}</span>
  </div>
);

export default Login;
