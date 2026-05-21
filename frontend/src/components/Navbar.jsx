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
    <nav class="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div class="flex items-center">
            <Link to="/" class="flex items-center gap-2 group">
              {/* Red Cross Icon inside a beautiful circle */}
              <div class="h-9 w-9 bg-accent-red rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                <Heart class="h-5 w-5 text-white fill-white" />
              </div>
              <div class="ml-2">
                <span class="block text-sm font-bold tracking-wide uppercase text-slate-100">Cooperadora</span>
                <span class="block text-[11px] text-teal-400 font-semibold tracking-wider uppercase -mt-1">Hosp. Necochea</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div class="flex items-center gap-4">
            <Link to="/" class="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
              Inicio
            </Link>

            {token ? (
              <div class="flex items-center gap-3">
                {/* User Badges */}
                <div class="hidden md:flex flex-col items-end">
                  <span class="text-xs text-slate-300 font-medium">{user?.email}</span>
                  <span class={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    user?.rol === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  }`}>
                    {user?.rol === 'admin' ? 'Administrador' : 'Socio'}
                  </span>
                </div>

                {user?.rol === 'admin' && (
                  <Link to="/admin" class="flex items-center gap-1.5 bg-slate-800 text-amber-400 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-amber-500/20 transition-all">
                    <Shield class="h-3.5 w-3.5" />
                    Panel Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  class="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-slate-700 transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut class="h-3.5 w-3.5" />
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/login" class="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-lg shadow-teal-900/20 transition-all">
                <User class="h-3.5 w-3.5" />
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
