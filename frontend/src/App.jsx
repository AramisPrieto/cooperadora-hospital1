import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactLenis } from 'lenis/react'; // TEAM_001: Wrapper oficial para React
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const Home = lazy(() => import('./views/Home'));
const Login = lazy(() => import('./views/Login'));
const ForgotPassword = lazy(() => import('./views/ForgotPassword'));
const ResetPassword = lazy(() => import('./views/ResetPassword'));
const AdminPanel = lazy(() => import('./views/AdminPanel'));
const SocioPanel = lazy(() => import('./views/SocioPanel'));
const CampaignSearch = lazy(() => import('./views/CampaignSearch'));
const CampaignDetail = lazy(() => import('./views/CampaignDetail'));
const NewsSearch = lazy(() => import('./views/NewsSearch'));
const NewsDetail = lazy(() => import('./views/NewsDetail'));
const ObrasConcretadas = lazy(() => import('./views/ObrasConcretadas'));

// Eliminadas funciones ProtectedRoute y SocioProtectedRoute inline

// Redirige al inicio si el usuario ya está autenticado
const GuestRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user) {
    const dest = user.rol === 'admin' ? '/admin' : '/';
    return <Navigate to={dest} replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  return (
    <ReactLenis root>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <main className="flex-grow flex flex-col">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-600"></div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
                <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
                <Route path="/campanas" element={<CampaignSearch />} />
                <Route path="/campanas/:id" element={<CampaignDetail />} />
                <Route path="/noticias" element={<NewsSearch />} />
                <Route path="/noticias/:id" element={<NewsDetail />} />
                <Route path="/obras-concretadas" element={<ObrasConcretadas />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mi-panel"
                  element={
                    <ProtectedRoute allowedRoles={['socio', 'admin']}>
                      <SocioPanel />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </Router>
      <Analytics />
      <SpeedInsights />
    </ReactLenis>
  );
}

export default App;
