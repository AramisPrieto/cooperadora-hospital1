import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogOut, User, Menu, X, Heart, Target } from 'lucide-react';
import { useLenis } from 'lenis/react';

import api from '../api/axios';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    };
    fetchSession();
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);

      if (location.pathname !== '/') {
        setActiveSection('');
        return;
      }

      const sections = ['noticias-section', 'obras-section', 'campanas-section'];
      let current = 'inicio';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            current = section;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [location]);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  const initials = user?.email?.charAt(0).toUpperCase() ?? 'U';
  const isAdmin = user?.rol === 'admin';

  /* ── Navbar Clínico ── */
  const navStyle = scrolled
    ? 'bg-white/70 backdrop-blur-md border-b border-slate-200/50 shadow-sm'
    : 'bg-transparent border-b border-transparent';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navStyle}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* ── Logo + Marca ── */}
          <Link to="/" className="flex items-center gap-4 group shrink-0">
            <img
              src="/logo.png"
              alt="Logo Cooperadora Hospital Necochea"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="hidden sm:block border-l border-slate-200 pl-4 py-1">
              <span className="block text-sm font-display font-black text-slate-800 leading-none tracking-wide">
                Cooperadora
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                Hospital Emilio Ferreyra
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink 
              to="/" 
              active={location.pathname === '/' && activeSection === 'inicio'}
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              Inicio
            </NavLink>
            <NavLink to="/campanas" active={location.pathname === '/campanas'}>Campañas</NavLink>
            <NavLink to="/obras-concretadas" active={location.pathname === '/obras-concretadas'}>Obras Concretadas</NavLink>
            <NavLink to="/noticias" active={location.pathname === '/noticias'}>Noticias</NavLink>
            {isAuthenticated && isAdmin && (
              <NavLink to="/admin" active={location.pathname === '/admin'}>
                <Shield className="h-4 w-4" />
                Panel Admin
              </NavLink>
            )}
            {isAuthenticated && !isAdmin && (
              <NavLink to="/mi-panel" active={location.pathname === '/mi-panel'}>
                <User className="h-4 w-4" />
                Mi Panel
              </NavLink>
            )}
          </div>

          {/* ── Desktop Auth ── */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
                {/* Chip usuario */}
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isAdmin ? 'bg-slate-800 text-white' : 'bg-brand-100 text-brand-700'}`}>
                    {initials}
                  </div>
                  <div className="hidden lg:block min-w-0">
                    <p className="text-xs text-slate-800 font-bold leading-none truncate max-w-[130px]">
                      {user?.email}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isAdmin ? 'Admin' : 'Socio'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-brand px-6 py-2.5 text-sm">
                <Heart className="h-4 w-4" />
                Asociarse / Ingresar
              </Link>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-slide-down shadow-lg absolute w-full">
          <div className="px-4 py-5 space-y-2">
            <MobileNavLink 
              to="/" 
              active={location.pathname === '/' && activeSection === 'inicio'}
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  setMobileOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              Inicio
            </MobileNavLink>
            <MobileNavLink to="/campanas" active={location.pathname === '/campanas'} onClick={() => setMobileOpen(false)}>Campañas</MobileNavLink>
            <MobileNavLink to="/obras-concretadas" active={location.pathname === '/obras-concretadas'} onClick={() => setMobileOpen(false)}>Obras Concretadas</MobileNavLink>
            <MobileNavLink to="/noticias" active={location.pathname === '/noticias'} onClick={() => setMobileOpen(false)}>Noticias</MobileNavLink>
            {isAuthenticated && isAdmin && (
              <MobileNavLink to="/admin" active={location.pathname === '/admin'}>
                Panel Administrativo
              </MobileNavLink>
            )}
            {isAuthenticated && !isAdmin && (
              <MobileNavLink to="/mi-panel" active={location.pathname === '/mi-panel'}>
                Mi Panel de Socio
              </MobileNavLink>
            )}
            <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${isAdmin ? 'bg-slate-800 text-white' : 'bg-brand-100 text-brand-700'}`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 font-bold truncate">{user?.email}</p>
                      <p className="text-[10px] font-bold uppercase text-slate-500">
                        {isAdmin ? 'Administrador' : 'Socio Activo'}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-600 hover:text-brand-600 bg-white border border-slate-200 hover:border-brand-200 rounded-xl transition-colors">
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link to="/login" className="w-full btn-brand py-3.5 text-sm flex items-center justify-center gap-2">
                  <Heart className="h-4 w-4" />
                  Asociarse / Ingresar
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, active, onClick, children }) => (
  <Link to={to}
    onClick={onClick}
    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
      active
        ? 'text-brand-700 bg-brand-50'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    {children}
  </Link>
);

const MobileNavLink = ({ to, active, onClick, children }) => (
  <Link to={to}
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
      active ? 'text-brand-700 bg-brand-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}>
    {children}
  </Link>
);

const ScrollLink = ({ to, active, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const lenis = useLenis();

  const handleScroll = (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(to);
        if (el) {
          if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.4 });
          else el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } else {
      const el = document.getElementById(to);
      if (el) {
        if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.4 });
        else el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <button onClick={handleScroll} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
      active ? 'text-brand-700 bg-brand-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`}>
      {children}
    </button>
  );
};

const MobileScrollLink = ({ to, active, setMobileOpen, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const lenis = useLenis();

  const handleScroll = (e) => {
    e.preventDefault();
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(to);
        if (el) {
          if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.4 });
          else el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } else {
      const el = document.getElementById(to);
      if (el) {
        if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.4 });
        else el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <button onClick={handleScroll} className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-left ${
      active ? 'text-brand-700 bg-brand-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}>
      {children}
    </button>
  );
};

export default Navbar;
