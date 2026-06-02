# Registro de Cierre del Equipo - TEAM_002

## Integrantes y Roles
- **IA**: Antigravity (TEAM_002)
- **Usuario/Desarrollador**: Kevin Nielsen

## Contexto del Proyecto
- **Proyecto**: Cooperadora Hospital Municipal de Necochea
- **Fase Activa**: Unificación de la rama de seguridad (`feature/kevin/seguridad-backend`) con `main` y corrección de scroll suave.
- **Rama del repositorio**: `main`

## Tareas Completadas
1. [x] Registro inicial del equipo en engram (`TEAM_002`).
2. [x] Instalación de dependencias de seguridad (`express-rate-limit`, `express-validator`, `express-mongo-sanitize`).
3. [x] Creación e integración de middlewares `rateLimiter.js` y `validators.js` en el backend.
4. [x] Registro de `mongoSanitize()` e IP `globalLimiter` en `backend/index.js`.
5. [x] Aplicación de rate limit y validación de input a endpoints de autenticación y donación estándar.
6. [x] Cobertura del endpoint de donación por transferencia (`/donar-transferencia`) con rate limit y validación de montos.
7. [x] Limpieza de dependencias del frontend de Vite removiendo paquetes obsoletos de `@studio-freight/lenis` y unificando en el paquete oficial `lenis`.
8. [x] Adaptación de CSS global en `index.css` para scroll fluido.
9. [x] Implementación del helper `scrollTo` con offset de `-80` en `Home.jsx` para evitar solapamientos con la barra de navegación.
10. [x] Resolución de conflictos en `README.md` y actualización del historial de cambios.
11. [x] Pruebas de validación de inputs y rate limiting contra login exitosas.

## Traspaso / Estado de Entrega
- Los cambios se confirmaron localmente en la rama `main` en el commit `0573c49`.
- El frontend compila de forma estable para producción (`npm run build`).
- El backend corre de forma segura, rechazando inyecciones y spam.
