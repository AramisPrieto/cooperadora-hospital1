# Code Review Report - Security, Architecture & Performance

## 1. Postura de Seguridad (Security Posture)

**Severidad:** Crítica
**El Problema:** Almacenar el JWT y objetos de usuario sensibles (como los roles) directamente en el `localStorage` (`frontend/src/App.jsx`) hace que tu aplicación sea altamente vulnerable a ataques de Cross-Site Scripting (XSS). Si se inyecta algún script malicioso en tu frontend, este puede leer fácilmente el `localStorage` y secuestrar las sesiones de los usuarios.
**La Solución:** Transición a usar cookies seguras con `HttpOnly` y `SameSite` para la autenticación. 

**Severidad:** Baja
**El Problema:** En `authController.js`, si un DNI ya está registrado, la API responde con: `"El DNI provisto ya está registrado para otro socio."` permitiendo **Enumeración de Usuarios**.
**La Solución:** Usar mensajes de error genéricos durante el registro.

## 2. Calidad de Código y Arquitectura (Code Quality & Architecture)

**Severidad:** Media
**El Problema:** "Controladores Pesados" (Fat Controllers) en `authController.js`.
**La Solución:** Separar la lógica de negocio en una capa de Servicio (Service).

**Severidad:** Baja
**El Problema:** Guardias de rutas en línea (inline) dentro de `frontend/src/App.jsx`.
**La Solución:** Extraer estos guardias en componentes dedicados (`ProtectedRoute.jsx`).

## 3. Optimización de Rendimiento (Performance Optimization)

**Severidad:** Media
**El Problema:** No hay caché de acceso rápido para endpoints públicos como `/api/campanas` o `/api/noticias`.
**La Solución:** Implementar caché básica en memoria con `node-cache` para esos endpoints.

---
*Nota: Estas recomendaciones han sido implementadas en la última versión del proyecto.*
