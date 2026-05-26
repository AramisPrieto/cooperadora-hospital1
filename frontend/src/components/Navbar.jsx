import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, User, Menu, Heart } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              {/* Logo institucional de la Cooperadora */}
              <img 
                src="/logo.png" 
                alt="Logo Cooperadora" 
                className="h-10 w-10 object-contain rounded-lg bg-white p-0.5 shadow-lg transition-transform group-hover:scale-105" 
              />
              <div className="ml-2">
                <span className="block text-sm font-bold tracking-wide uppercase text-slate-100">Cooperadora</span>
                <span className="block text-[11px] text-teal-400 font-semibold tracking-wider uppercase -mt-1">Hosp. Necochea</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              Inicio
            </Link>

            {token ? (
              <div className="flex items-center gap-3">
                {/* User Badges */}
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs text-slate-300 font-medium">{user?.email}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    user?.rol === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  }`}>
                    {user?.rol === 'admin' ? 'Administrador' : 'Socio'}
                  </span>
                </div>

                {user?.rol === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-1.5 bg-slate-800 text-amber-400 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-amber-500/20 transition-all">
                    <Shield className="h-3.5 w-3.5" />
                    Panel Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-slate-700 transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-lg shadow-teal-900/20 transition-all">
                <User className="h-3.5 w-3.5" />
                Asociarse / Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
