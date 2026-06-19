import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Mail, Lock, User, Heart, ShieldAlert, Award, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLogin, setIsLogin] = useState(() => {
    return searchParams.get('mode') !== 'register';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Campos de perfil para registro
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [direccion, setDireccion] = useState('');
  const [localidad, setLocalidad] = useState('Necochea');
  const [nacionalidad, setNacionalidad] = useState('Argentina');
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

  return (
    /* Fondo institucional — claro y limpio */
    <div className="flex-grow flex items-center justify-center py-12 pt-28 px-4 relative overflow-hidden bg-slate-50 min-h-[90vh]">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-50/50 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-50/50 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 translate-y-1/3" />

      {/* Main Container: Split-screen Card */}
      <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-xl border border-slate-200/60 overflow-hidden grid md:grid-cols-12 animate-fade-up min-h-[620px] z-10">
        
        {/* Left Side: Premium Brand Presentation */}
        <div className="hidden md:flex md:col-span-5 bg-slate-950 text-white p-10 flex-col justify-between relative overflow-hidden text-left">
          {/* Radial Gradient Highlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-brand-950/40 via-slate-950 to-slate-950 -z-10" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          {/* Top Logo Brand */}
          <div className="space-y-3">
            <div className="h-10 w-10 bg-brand-650 rounded-xl flex items-center justify-center shadow-md shadow-brand-600/10 shrink-0">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
            <div>
              <span className="block text-sm font-display font-black tracking-wide text-white leading-none">Cooperadora</span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 leading-none">Hospital Emilio Ferreyra</span>
            </div>
          </div>

          {/* Middle Text / Quote */}
          <div className="space-y-6 my-8">
            <h3 className="text-2xl font-display font-black leading-tight text-white">
              Unidos por la salud de nuestra comunidad.
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Tu participación como socio activo o donante nos permite adquirir equipamiento tecnológico de alta gama e insumos médicos esenciales para el hospital.
            </p>
            
            {/* Milestones ticker */}
            <div className="space-y-3 pt-6 border-t border-slate-900">
              <div className="flex items-center gap-3">
                <div className="h-6 w-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
                  <span className="text-[10px] font-black text-brand-400">60+</span>
                </div>
                <span className="text-xs text-slate-300 font-bold">Años sirviendo al hospital</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
                  <span className="text-[10px] font-black text-brand-400">100%</span>
                </div>
                <span className="text-xs text-slate-300 font-bold">Trazabilidad en cada centavo</span>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Personería Jurídica Nº 4821
          </div>
        </div>

        {/* Right Side: Form Content */}
        <div className="col-span-12 md:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6 text-left">
          
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-black text-slate-900">
              {isLogin ? 'Ingresar a la Cooperadora' : 'Crear cuenta de socio'}
            </h2>
            <p className="text-slate-555 text-xs mt-1 leading-relaxed font-semibold">
              {isLogin
                ? 'Ingresá tus credenciales para gestionar tus aportes y cuotas.'
                : 'Completá el formulario para registrarte en el Libro de Asociados del Hospital Ferreyra.'}
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex bg-slate-100 rounded-2xl p-1 max-w-sm">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-slate-850 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-slate-850 shadow-sm border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Alerts */}
          {expired && <Alert color="amber" icon={<ShieldAlert className="h-4 w-4" />}>Sesión expirada. Por favor vuelva a ingresar.</Alert>}
          {errorMsg && <Alert color="rose" icon={<ShieldAlert className="h-4 w-4" />}>{errorMsg}</Alert>}
          {successMsg && <Alert color="emerald" icon={<Award className="h-4 w-4" />}>{successMsg}</Alert>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="email"
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
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Contraseña
                </label>
                {isLogin && (
                  <Link
                    to="/forgot-password"
                    className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 transition-colors uppercase tracking-wider"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="input-field pl-10 pr-11"
                  autoComplete={isLogin ? "current-password" : "new-password"}
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
              {!isLogin && (
                <p className="text-[9px] text-slate-450 pl-0.5 mt-1 font-semibold">
                  Debe tener al menos 8 caracteres, una mayúscula y un número.
                </p>
              )}
            </div>

            {/* DNI (sólo registro) */}
            {!isLogin && (
              <>
                <div className="space-y-1.5 animate-fade-up">
                  <label htmlFor="dni" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    DNI <span className="text-red-500 normal-case font-normal">(Obligatorio para socios)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      id="dni"
                      type="number"
                      required
                      value={dni}
                      onChange={e => setDni(e.target.value)}
                      placeholder="Sin puntos ej: 30123456"
                      className="input-field pl-10"
                    />
                  </div>
                  <p className="text-[9px] text-slate-450 flex items-center gap-1 pl-0.5 font-semibold">
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
                      <label htmlFor="nombre" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Nombre *</label>
                      <input id="nombre" type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="apellido" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Apellido *</label>
                      <input id="apellido" type="text" required value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Pérez" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="telefono" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Teléfono *</label>
                      <input id="telefono" type="text" required value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="2262550000" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="nacionalidad" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Nacionalidad *</label>
                      <select id="nacionalidad" required value={nacionalidad} onChange={e => setNacionalidad(e.target.value)} className="input-field py-2 text-sm">
                        <option value="">Seleccione...</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Extranjera">Extranjera</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="direccion" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Dirección *</label>
                      <input id="direccion" type="text" required value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle 60 1234" className="input-field py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="localidad" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Localidad *</label>
                      <select id="localidad" required value={localidad} onChange={e => setLocalidad(e.target.value)} className="input-field py-2 text-sm">
                        <option value="">Seleccione...</option>
                        <option value="Necochea">Necochea</option>
                        <option value="Quequén">Quequén</option>
                        <option value="La Dulce">La Dulce</option>
                        <option value="Juan N. Fernández">Juan N. Fernández</option>
                        <option value="Claraz">Claraz</option>
                        <option value="Ramón Santamarina">Ramón Santamarina</option>
                        <option value="Otra">Otra</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="fechaNacimiento" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">F. Nacimiento *</label>
                      <input id="fechaNacimiento" type="date" required value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} className="input-field py-2.5 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="genero" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Género *</label>
                      <select id="genero" required value={genero} onChange={e => setGenero(e.target.value)} className="input-field py-2 text-sm">
                        <option value="">Seleccione...</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label htmlFor="metodoPago" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Método de Pago Preferido *</label>
                      <select id="metodoPago" required value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className="input-field py-2 text-sm">
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
              className="btn-brand w-full py-3.5 mt-2 text-sm shadow-md"
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
          <p className="text-center text-[11px] text-slate-400 font-bold tracking-wide">
            Acceso protegido de forma <span className="text-brand-650 font-black">segura y encriptada</span>. Sin anonimato.
          </p>
        </div>
      </div>
    </div>
  );
};

/* Helper Alert */
const ALERT_STYLES = {
  amber:  'bg-amber-50 border-amber-200 text-amber-800',
  rose:   'bg-red-50 border-red-200 text-red-750',
  emerald:'bg-emerald-50 border-emerald-200 text-emerald-800',
};
const Alert = ({ color, icon, children }) => (
  <div className={`flex items-start gap-2.5 p-3.5 border rounded-xl text-xs font-semibold ${ALERT_STYLES[color]}`}>
    <span className="shrink-0 mt-0.5">{icon}</span>
    <span>{children}</span>
  </div>
);

export default Login;
