# 📋 Registro y Seguimiento de Tareas (TODO)

Este documento detalla el estado del plan de trabajo acordado para el desarrollo y optimización del portal de la **Asociación Cooperadora del Hospital Municipal "Dr. Emilio Ferreyra"**.

---

## ✅ Tareas e Hitos de la Etapa Final (100% Completado)

Todas las metas principales de implementación, seguridad y diseño han sido cubiertas:

- **[x] Inicializar y Estructurar Repositorio Git:** Configuración de monorrepo mediante `pnpm workspaces`.
- **[x] Vinculación Frontend-Backend:** Conexión segura mediante Axios con soporte de proxy inverso.
- **[x] Registro de Socios Avanzado:** Formulario con sanitización de datos, DNI y campos ampliados.
- **[x] Panel de Administración Premium:** Grillas interactivas de socios, auditoría de transferencias y edición de campañas/noticias.
- **[x] Limites de Donación en Campañas:** Reglas de validación para impedir sobre-recaudación.
- **[x] Integración de Mercado Pago:** Donaciones online y suscripción a débito automático de cuotas mediante Webhooks.
- **[x] Sistema de Notificaciones por Correo:** Envío formal de bienvenida a socios y agradecimientos por donaciones vía SMTP.
- **[x] Suite de Pruebas Automatizadas:** 79 pruebas de integración unitarias y de API en el backend con Vitest.
- **[x] Accesibilidad (WCAG) y CLS:** Auditoría de contraste, navegación por teclado, soporte ARIA y optimización de CLS.
- **[x] Hardening de Seguridad (OWASP):** Implementación de Helmet, rate limiters, validación HMAC en webhooks y prevención de inyecciones NoSQL.

---

## 🔮 Roadmap de Futuras Versiones (Backlog de Evolución)

Tareas planificadas para siguientes iteraciones y mantenimiento post-entrega:

* **[ ] Autovalidación de Transferencias Bancarias:**
  * *Objetivo:* Integrar conciliación automática de extractos bancarios mediante OCR o APIs bancarias abiertas para automatizar la aprobación.
* **[ ] Eliminación y Depuración de Cuentas de Usuario:**
  * *Objetivo:* Implementar la opción de autogestión de baja en cumplimiento con el derecho de supresión de datos (GDPR).
* **[ ] Notificaciones de Activación de Cuenta:**
  * *Objetivo:* Disparar una alerta automatizada por correo cuando el administrador cambie el estado del asociado de `pendiente` a `activo`.
* **[ ] Visibilidad Selectiva de Novedades:**
  * *Objetivo:* Permitir que el operador configure artículos de noticias en modo borrador ("No Visible") en lugar de publicación inmediata.
