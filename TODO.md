# 📋 Plan de Trabajo y Backlog del Proyecto

## 🚀 Prioridades Actuales
- [ ] Analizar con la Cooperadora alternativas de conciliación bancaria semiautomatizada para transferencias directas.
- [ ] Afinar métricas de últimos donantes en el panel administrativo.
- [ ] Validar compatibilidad de métodos de pago en el resumen contable de campañas.

## 🛠️ Tareas por Hacer (Backlog)
- [ ] Explorar integración con webhooks de homebanking para autovalidación de transferencias bancarias.
- [ ] Diseñar reporte exportable a Excel/CSV del padrón de socios para la secretaría del hospital.
- [ ] Agregar vista previa de comprobantes adjuntos en modal dentro del panel de administración.

## 🔄 En Progreso
- [ ] Pruebas finales de estrés y carga en staging previo al pase definitivo.

## ✅ Terminado
- [x] Inicializar repositorio Git y modelo de ramas (main, develop, features)
- [x] Configurar monorepo centralizado con `pnpm workspaces` (Thiago Masson & Aramis Prieto)
- [x] Vincular y comunicar el cliente frontend (React/Vite) con la API backend (Express)
- [x] Formulario unificado de registro de socios con validaciones estrictas (DNI, contacto) (Aramis Prieto)
- [x] Diseñar y maquetar el panel de administración clínica responsivo (Santiago Ialungo)
- [x] Sistema de autenticación JWT y roles protegidos (admin/socio) con mitigación IDOR
- [x] Control transaccional de concurrencia (`SELECT ... FOR UPDATE`) y reglas de tope de donación
- [x] Suite de pruebas automatizadas de integración y seguridad con Vitest y Supertest (Aramis Prieto)
- [x] Armar panel privado del socio con pestañas de Resumen, Cuotas y Donaciones (Thiago Masson)
- [x] Integración oficial de pasarela de cobro y suscripciones recurrentes con Mercado Pago SDK
- [x] Migración del servicio de correos a la API REST de Resend por puerto HTTPS 443 (Kevin Nielsen & Aramis Prieto)
- [x] Envío automatizado de correos: bienvenida, agradecimiento por donación, aviso de socio aprobado y recupero de clave
- [x] Flujo transaccional seguro de recuperación de contraseñas (`forgot-password` / `reset-password`)
- [x] Módulo dinámico de noticias en MongoDB con sanitización DOMPurify y eliminación de tags redundantes
- [x] Módulo accesible de compartido rápido en redes sociales (`ShareModal`) (Santiago Ialungo & Thiago Masson)
- [x] Desplazamiento inercial fluido con `@lenis/react` y contención en modales (`data-lenis-prevent`)
- [x] Vista independiente de Obras Concretadas con formato interactivo de línea de tiempo
- [x] Pestaña de administración y auditoría de Cuotas Sociales con paginación y búsqueda en tiempo real
- [x] Vista de Términos y Condiciones legales conforme a la Ley N° 25.326 de Protección de Datos Personales
- [x] Flujo de baja de membresía y cuenta (autogestión y administrativa) preservando el registro contable histórico
- [x] Despliegue y configuración productiva en la nube (Vercel + Render + MongoDB Atlas + PostgreSQL)
