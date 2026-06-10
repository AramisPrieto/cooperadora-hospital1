import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Importante para enviar/recibir cookies HttpOnly
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones (ya no inyectamos token desde localStorage)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar errores globales (ej: token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Evitar bucle infinito si ya está en login
      if (!window.location.pathname.includes('/login')) {
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
