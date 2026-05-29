import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ReactLenis } from '@studio-freight/react-lenis';
import Navbar from './components/Navbar';
import Home from './views/Home';
import Login from './views/Login';
import AdminPanel from './views/AdminPanel';
import { Heart, Shield, Github } from 'lucide-react';

/* Protección de ruta admin */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token || user?.rol !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <ReactLenis root>
      <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* ── Footer ── */}
        <footer className="bg-transparent border-t border-slate-200 mt-auto relative z-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center border border-brand-100">
                  <Heart className="h-4 w-4 text-brand-600 fill-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-display font-black text-slate-800">Cooperadora</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Hospital Municipal Dr. Emilio Ferreyra</p>
                </div>
              </div>

              {/* Center text */}
              <p className="text-xs text-slate-500 text-center font-medium md:mr-auto md:ml-8">
                © 2026 Asociación Cooperadora — Necochea, Buenos Aires.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
    </ReactLenis>
  );
}

export default App;
