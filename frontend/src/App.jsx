import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './views/Home';
import Login from './views/Login';
import AdminPanel from './views/AdminPanel';

// Componente para proteger rutas administrativas
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || user?.rol !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Navbar />
      <main class="flex-grow flex flex-col">
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
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Elegant minimalist footer */}
      <footer class="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 space-y-2 font-medium">
          <p>© 2026 Asociación Cooperadora del Hospital Municipal Dr. Emilio Ferreyra - Necochea.</p>
          <p class="text-[10px] text-slate-500 uppercase tracking-widest">Etapa 4 • Trabajo Final Integrador TFI • Programación IV</p>
        </div>
      </footer>
    </Router>
  );
}

export default App;
