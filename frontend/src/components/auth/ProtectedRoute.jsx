import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../../api/axios';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = cargando, true/false = resuelto
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await api.get('/auth/me');
        setIsAuthenticated(true);
        setUserRole(response.data.user.rol);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } catch (error) {
        console.error("Error validando sesión:", error);
        setIsAuthenticated(false);
      }
    };

    verifySession();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
