import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sincronizar sesión con backend al iniciar
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      try {
        const res = await api.get('/auth/me');
        if (isMounted) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('user');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifySession();

    const handleAuthExpired = () => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login?expired=true');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [navigate]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setLoading(false);
  };

  const logout = async (redirectTo = '/login') => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      if (redirectTo) {
        navigate(redirectTo);
      }
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin',
    isSocio: user?.rol === 'socio',
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return {
        user,
        loading: false,
        isAuthenticated: !!user,
        isAdmin: user?.rol === 'admin',
        isSocio: user?.rol === 'socio',
        login: () => {},
        logout: async () => {
          try {
            await api.post('/auth/logout');
          } catch (err) {
            console.error('Error logging out:', err);
          } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        },
        updateUser: () => {}
      };
    } catch {
      return {
        user: null,
        loading: false,
        isAuthenticated: false,
        isAdmin: false,
        isSocio: false,
        login: () => {},
        logout: async () => {
          try {
            await api.post('/auth/logout');
          } catch (err) {
            console.error('Error logging out:', err);
          } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        },
        updateUser: () => {}
      };
    }
  }
  return context;
};
