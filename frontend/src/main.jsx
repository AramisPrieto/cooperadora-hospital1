import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Protección básica para la etapa de desarrollo
const password = prompt("Ingrese la contraseña del equipo para acceder:");
if (password !== "admin123") {
  document.body.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background-color:#f3f4f6; color:#1f2937;">
      <div style="text-align:center; padding: 2rem; background:white; border-radius:12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color:#ef4444; margin-bottom:1rem;">Acceso Denegado</h1>
        <p>No tienes permiso para ver esta aplicación en desarrollo.</p>
        <button onclick="window.location.reload()" style="margin-top:1rem; padding:0.5rem 1rem; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer;">Intentar de nuevo</button>
      </div>
    </div>
  `;
  throw new Error("Privado");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
