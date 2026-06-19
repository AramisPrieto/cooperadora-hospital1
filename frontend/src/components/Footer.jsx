import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, MapPin, Phone, Mail } from 'lucide-react';
import { useLenis } from 'lenis/react';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lenis = useLenis();

  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.4 });
          else el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.4 });
        else el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleInicioClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-left">
          {/* Columna 1: Branding y Legal */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo Cooperadora Hospital Necochea"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <p className="text-sm font-display font-black text-white tracking-wide">
                Cooperadora Hospital Necochea
              </p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Asociación civil sin fines de lucro fundada en 1962.
            </p>
            <p className="text-[11px] text-slate-500 font-bold">
              Personería Jurídica Nº 4821 / CUIT 30-58392019-7
            </p>
          </div>

          {/* Columna 2: Secciones */}
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-4">Cooperadora</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
              <li>
                <Link to="/" onClick={handleInicioClick} className="hover:text-white transition-colors">Inicio</Link>
              </li>
              <li>
                <Link to="/campanas" className="hover:text-white transition-colors">Campañas</Link>
              </li>
              <li>
                <Link to="/obras-concretadas" className="hover:text-white transition-colors">Obras Concretadas</Link>
              </li>
              <li>
                <Link to="/noticias" className="hover:text-white transition-colors">Noticias</Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Aportar */}
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-4">Aportar</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
              <li>
                <Link to="/campanas" className="hover:text-white transition-colors">Donar una vez</Link>
              </li>
              <li>
                <Link to="/login?mode=register" className="hover:text-white transition-colors">Hacete socio</Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-4">Contacto</h4>
            <div className="flex gap-4 items-center">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Calle+56+N%C2%BA+2877%2C+Necochea"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-slate-900 hover:bg-brand-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-sm border border-slate-800"
                title="Calle 56 Nº 2877, Necochea"
                aria-label="Ubicación en Google Maps de la Cooperadora"
              >
                <MapPin className="h-5 w-5" />
              </a>
              <a
                href="tel:1234567890"
                className="p-2.5 bg-slate-900 hover:bg-brand-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-sm border border-slate-800"
                title="1234567890"
                aria-label="Llamar por teléfono a la Cooperadora"
              >
                <Phone className="h-5 w-5" />
              </a>
              <a
                href="mailto:[EMAIL_ADDRESS]"
                className="p-2.5 bg-slate-900 hover:bg-brand-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-sm border border-slate-800"
                title="[EMAIL_ADDRESS]"
                aria-label="Enviar correo electrónico a la Cooperadora"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Fila Inferior */}
        <div className="border-t border-slate-900 pt-8 mt-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 font-bold">
            © 2026 Cooperadora Hospital Municipal Dr. Emilio Ferreyra
          </p>
          <p className="text-[11px] text-slate-500 font-bold">
            Sitio seguro · SSL · Datos protegidos por Ley 25.326
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
