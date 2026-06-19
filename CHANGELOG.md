# Changelog


### Versión 1.0.0 — Prototipo e APIs de la Etapa 4 (Aramis Prieto)
- **Persistencia Híbrida SQL/NoSQL**:
  - Implementación del motor relacional PostgreSQL (`usuarios`, `perfiles_socios`, `campanas_eco`) para consistencia transaccional y el motor documental MongoDB (`noticias_actualidad`, `campanas_detalle`) para datos estructurados flexibles y multimedia.
  - Creación del mecanismo **Data Mashup** sincrónico mediante `Promise.all` para fusionar y retornar en una sola llamada el estado financiero (SQL) y el contenido enriquecido (NoSQL) de las campañas.
- **Seguridad y Control de Acceso**:
  - Autenticación segura mediante **JSON Web Tokens (JWT)** y hashing de contraseñas con `bcryptjs`.
  - Redirección inteligente post-login: navegación fluida que redirige usuarios anónimos al Login y vuelve de forma transparente a abrir la campaña seleccionada mediante parámetros de URL.
- **Componentes Interactivos del Frontend**:
  - Esqueleto interactivo del cliente desarrollado en React (Vite) + Tailwind CSS.
  - Conexión del Hero a la primera campaña activa con estados de carga (skeletons) y control de estados vacíos.
  - Protección de concurrencia y doble clic en el Panel Administrativo deshabilitando botones de acción de forma dinámica.

### Versión 1.0.1 — Entorno pnpm, Logo Oficial y Noticias (Thiago Masson)
- **Migración a pnpm**:
  - Transición completa del monorrepo al gestor de paquetes `pnpm` para agilizar descargas y garantizar la consistencia en el árbol de dependencias.
- **Branding Institucional**:
  - Incorporación del logotipo oficial de la Asociación Cooperadora del Hospital Municipal "Dr. Emilio Ferreyra".
- **Módulo de Actualidad e Información**:
  - Creación del gestor de noticias dinámico conectado a la colección MongoDB (`noticias_actualidad`).
  - Renderizado HTML enriquecido de artículos sanitizado con **DOMPurify** en el cliente para prevenir inyecciones de código malicioso XSS.

### Versión 1.0.2 — Fusión e Integración en Rama Principal (Aramis Prieto)
- **Consolidación de Producción**:
  - Fusión e integración de los primeros desarrollos estables acumulados de `develop` hacia la rama principal `main` (Pull Request #1) para establecer la línea base funcional del proyecto.

### Versión 1.0.3 — Seguimiento de Tareas (TODO.md) (Aramis Prieto & Thiago Masson)
- **Coordinación de Equipo**:
  - Creación y actualización del archivo de seguimiento [TODO.md](file:///Users/aramisprieto/Documents/cooperadora-hospital1/TODO.md) en la raíz del proyecto para organizar de manera transparente el backlog de tareas pendientes, en curso y finalizadas.
  - Registro de requerimientos prioritarios como la validación de PDFs de etapas previas, límites de donación para campañas completadas, diseño del panel administrativo y selección mensual de campañas de recaudación.

### Versión 1.0.4 — Rediseño Estético Clínico y Scroll-Spy (Santiago Ialungo)
- **Renovación Estética de UI/UX**:
  - Transición de un diseño oscuro de desarrollo a una interfaz moderna, limpia y netamente profesional orientada a la salud.
  - Paleta de color optimizada: base clara en `slate-50`, acentos rojos institucionales (`brand-600`) y verde esmeralda clínico (`accent-600`).
  - Textura visual mediante un patrón lineal que emula una cuadrícula de electrocardiograma (ECG) en el fondo.
- **Navegación e Interacción**:
  - Detección de lectura en Navbar (*Scroll-Spy*) para destacar dinámicamente la sección activa de la vista actual.
  - Integración de Lenis para un scroll inercial suave sin tirones.
  - Rediseño de indicadores financieros, contadores y optimización de gráficos en el Panel Administrativo.

### Versión 1.1.0 — Checkout de Transferencias y Corrección de Scroll (Kevin Nielsen)
- **Donaciones por Transferencia Bancaria**:
  - Creación de la tabla relacional [DonacionTransferencia.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/models/DonacionTransferencia.js) en PostgreSQL para auditar transferencias declaradas.
  - Implementación de rutas y controladores para la declaración segura de transferencias en `/api/donaciones`.
- **Aprobación Administrativa Manual**:
  - Adición de la sección de transferencias en [AdminPanel.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/AdminPanel.jsx) permitiendo a los operadores aprobar o rechazar transacciones manualmente, actualizando en tiempo real la barra de progreso de la campaña correspondiente.
- **Optimización y Limpieza de UI**:
  - Simplificación del modal en [Home.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/Home.jsx) ocultando datos multimedia secundarios a fin de incentivar una conversión de donación rápida.
  - Migración del wrapper de Lenis al módulo `@lenis/react`, removiendo comportamientos heredados de [index.css](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/index.css) para evitar colisiones.
- **Variables de Entorno**:
  - Parametrización en [docker-compose.yml](file:///Users/aramisprieto/Documents/cooperadora-hospital1/docker-compose.yml) usando variables locales para mayor portabilidad de infraestructura.

### Versión 1.2.0 — Seguridad Backend e Inputs (Kevin Nielsen)
- **Rate Limiting por IP**:
  - Configuración de políticas de control de tasa en [rateLimiter.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/middleware/rateLimiter.js): 100 peticiones globales cada 15 min, 10 intentos de autenticación cada 15 min, y 5 donaciones por hora.
- **Validación de Datos Entrantes**:
  - Middleware de control en [validators.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/middleware/validators.js) con reglas estrictas para DNI (longitud y valor), formato de correo electrónico y límites de donación seguros (entre $1 y $10.000.000).
- **Protección contra Inyección NoSQL**:
  - Sanitización automática del cuerpo de solicitudes mediante `express-mongo-sanitize` para remover operadores prohibidos (como `$` y `.`).
- **Navegación Fluida**:
  - Ajuste del helper de desplazamiento con offset negativo de `-80px` para impedir que el Navbar fije tapase el título de la sección de destino.

### Versión 1.2.1 — Registro de Cierre de Sesión (Kevin Nielsen)
- **Auditoría e Historial de Accesos**:
  - Registro de eventos específicos de cierre de sesión (`TEAM_002`) en logs para seguimiento de la sesión del usuario operador en el panel de administración.

### Versión 1.3.0 — Simplificación de Donaciones y Peticiones Directas (Kevin Nielsen)
- **Eliminación de Donación Simulada**:
  - Remoción total del método de pago directo con tarjeta simulada de crédito en frontend y backend para concentrar la contabilidad en transferencias auditables directas.
  - Eliminación de controladores y rutas obsoletas como `POST /api/campanas/:id/donar` en [campanaController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/campanaController.js).
- **Consolidación de Dependencias**:
  - Adición formal de archivos de bloqueo `pnpm-lock.yaml` en las carpetas de frontend y backend para consolidar entornos de ejecución idénticos e impedir desajustes en versiones de paquetes instalados.

### Versión 1.4.0 — Servicio de Correo y Agradecimientos Automatizados (Kevin Nielsen)
- **Integración del Módulo SMTP**:
  - Integración de `nodemailer` en el backend para envío de correos electrónicos.
  - Configuración y parametrización de variables SMTP en el archivo de entorno mediante la actualización de [backend/.env.example](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/.env.example).
- **Plantillas HTML de Emails Personalizados**:
  - Creación del servicio en [emailService.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/services/emailService.js) con soporte de diseño adaptativo y estilizado para enviar un mensaje formal de agradecimiento institucional al socio una vez que el operador aprueba su transferencia en el panel.
- **Desencadenador Transaccional**:
  - Conexión asíncrona en [donacionController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/donacionController.js) para despachar el correo de forma no bloqueante inmediatamente al confirmarse la transacción de la donación.

### Versión 1.5.0 — Límites de Campaña y Suite de Pruebas Automatizadas (Aramis Prieto)
- **Validación del Límite de Recaudación en Campañas**:
  - Implementación de reglas de negocio en [donacionController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/donacionController.js) para evitar sobre-donaciones. Bloquea la declaración e impide la aprobación de transferencias que superen el monto objetivo restante de la campaña.
- **Suite de Pruebas Automatizadas con Vitest y Supertest**:
  - Creación de 47 pruebas de integración en la carpeta `backend/tests/` que cubren todas las API expuestas (Autenticación, Socios, Campañas con Mashup, Noticias y Donaciones/Límites).
  - Configuración de un entorno de bases de datos de test aislado en Postgres (`cooperadora_db_test`) y MongoDB (`cooperadora_nosql_test`) con limpieza automática entre tests a través de [setup.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/tests/helpers/setup.js).
  - Exclusión de rate limiting en modo test en [rateLimiter.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/middleware/rateLimiter.js) para evitar bloqueos por solicitudes frecuentes.

### Versión 1.6.0 — Desarrollo del Panel de Socios en el Backend (Thiago Masson)
- **Modelo de Control de Cuotas Sociales**:
  - Creación del modelo relacional [PagoCuota.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/models/PagoCuota.js) en PostgreSQL para registrar el historial de pago de cuotas mensuales de los asociados (mes, año, monto, estado de pago).
  - Configuración de relaciones y cascada de borrado en [models/index.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/models/index.js).
- **Nuevas Rutas y Controladores de Autogestión**:
  - Implementación de la ruta `GET /api/socios/mi-perfil/cuotas` para consultar el historial de cuotas sociales del socio autenticado en [socioRoutes.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/routes/socioRoutes.js) y [socioController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/socioController.js).
  - Implementación de la ruta `GET /api/donaciones/mis-donaciones` en [donacionRoutes.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/routes/donacionRoutes.js) y su controlador en [donacionController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/donacionController.js) para permitir que los socios consulten las transferencias que declararon históricamente.
- **Actualización de Datos de Prueba y Seeds**:
  - Ajuste en [seed.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/seed.js) para levantar automáticamente un administrador (`admin@cooperadora.org`) y un socio de prueba (`socio@cooperadora.org`) con su perfil activo e historial de cuotas del año 2026.
- **Verificación Automatizada**:
  - Creación de la suite de pruebas automatizadas [socioPanel.test.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/tests/socioPanel.test.js) que valida el correcto funcionamiento de los endpoints y los mecanismos de bloqueo de peticiones anónimas (Status 401).

### Versión 1.7.0 — Integración de Mercado Pago y Gestión de Pagos en Panel de Socios (Aramis Prieto)
- **Modelo Ampliado de Socios y Base de Datos**:
  - Ampliación del esquema de [PerfilSocio.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/models/PerfilSocio.js) en PostgreSQL para registrar información de contacto detallada: `nombre`, `apellido`, `direccion`, `nacionalidad`, `telefono`, `fecha_nacimiento`, `genero`, `metodo_pago` ('transferencia', 'efectivo', 'debito'), `fecha_ultimo_pago`, `localidad` y `observaciones`.
  - Unificación del modelo [PagoCuota.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/models/PagoCuota.js) para integrar los períodos de facturación (`mes`, `anio`) con el registro de transacciones de pago (`metodo_pago`, `mp_payment_id`, `numero_comprobante`, `comprobante_url`), utilizando `socio_numero_asociado` como clave foránea única.
- **Integración con Mercado Pago para Cuotas Sociales**:
  - Creación del servicio [mpService.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/services/mpService.js) que se integra con el SDK oficial de Mercado Pago para gestionar suscripciones recurrentes de débito automático.
  - Implementación de webhooks transaccionales en `/api/webhooks/mercadopago` que procesan notificaciones de tipo `preapproval` (suscripción) y `payment` (captura del cobro mensual), actualizando el estado de la membresía y registrando las transacciones en tiempo real.
- **Flujo de Pago y Declaración Manual**:
  - Implementación de endpoints seguros de autogestión en `/api/socios/mi-perfil/pagos/declarar` para que los asociados puedan reportar comprobantes de pago de cuota mediante transferencia bancaria.
  - Creación de rutas de autogestión de suscripción Mercado Pago (`POST /api/socios/suscripcion/crear` y `POST /api/socios/suscripcion/cancelar`).
- **Rediseño Premium del Panel de Socio**:
  - Fusión de las funcionalidades en una interfaz de usuario integrada en [SocioPanel.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/SocioPanel.jsx) dividida en pestañas estéticas y responsivas:
    - **Mi Resumen**: Permite visualizar la ficha del asociado y actualizar sus datos de contacto y DNI.
    - **Mis Cuotas**: Integra el historial de períodos mensuales con el historial transaccional de pagos, y ofrece un selector dinámico para pagar a través de débito automático de Mercado Pago, registrar manualmente una transferencia o ver información del cobrador domiciliario.
    - **Mis Donaciones**: Muestra el registro histórico de aportes hechos a las campañas del hospital.
- **Pruebas de Integración y Verificación**:
  - Creación de la suite de pruebas [socioSubscription.test.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/tests/socioSubscription.test.js) que verifica la creación de suscripciones, cancelación, declaraciones manuales y callbacks asíncronos del webhook.

### Versión 1.8.0 — Control de Método de Pago y Donaciones con Mercado Pago (Grupo Cooperadora)
- **Control de Cambios de Método de Pago**:
  - Adición de las columnas `cant_cambios_metodo_pago` y `mes_ultimo_cambio_metodo_pago` en `PerfilSocio.js`.
  - Implementación de validaciones a nivel de backend en `socioController.js` para limitar las actualizaciones de método de pago a un máximo de 3 por mes para los socios. Los administradores están exentos de esta restricción.
  - Inclusión de diálogos de confirmación del navegador (`window.confirm`) en el panel de socios de `SocioPanel.jsx` antes de actualizar el medio de pago, capturando y desplegando adecuadamente los errores de validación HTTP 400.
- **Donaciones en Línea para Campañas**:
  - Integración del botón y pestaña de pago online con **Mercado Pago** en el modal de detalles de campañas en `Home.jsx`, incluyendo redirecciones seguras y alertas globales de éxito o fallo (`donation_success`/`donation_failure`).
  - Creación del endpoint `POST /api/donaciones/campanas/:id/donar-mp` y su correspondiente controlador en `donacionController.js` para generar preferencias de pago seguro.
  - Ampliación del webhook de Mercado Pago en `socioSubscriptionController.js` para detectar transacciones con formato de referencia externa `donation_u{userId}_c{campanaId}`, registrar aportes confirmados, actualizar de forma segura y concurrente el monto acumulado de la campaña con bloqueo de fila (`LOCK.UPDATE`), y despachar correos electrónicos SMTP de agradecimiento.
- **Robustez de Entorno y Pruebas**:
  - Incorporación de 6 nuevas pruebas de integración automatizadas en las suites `socio.test.js` and `donacion.test.js`, elevando a 79 el total de casos exitosos.
  - Configuración de la directiva `server.allowedHosts: true` en `vite.config.js` para facilitar el testeo remoto y compatibilidad con túneles HTTPS de desarrollo.

### Versión 1.9.0 — Túneles Dinámicos y Proxy de Retorno Seguro para Mercado Pago (Aramis Prieto)
- **Automatización de Túneles Locales**:
  - Creación del script avanzado de inicialización `start-dev-with-tunnel.js` para levantar ngrok o túneles SSH de Pinggy de manera dinámica.
  - Auto-inyección de la variable de entorno `BACKEND_TUNNEL_URL` en ejecución para habilitar el enrutamiento bidireccional instantáneo de Webhooks en local.
- **Bypass de Restricciones HTTPS (Return Proxy)**:
  - Implementación de controladores públicos (`handleMpRedirect` y `handleSocioMpRedirect`) que actúan como pasarelas de retorno HTTP 302 seguras.
  - Esto soluciona de raíz el error 400 Bad Request devuelto por las APIs de Preferences y PreApproval de MP, las cuales rechazan estrictamente cualquier URL de retorno que comience con `http://` (como los entornos `localhost`). El flujo ahora dirige al usuario al túnel `https://` y este lo rebota limpiamente a su navegador local reteniendo los parámetros de estado de pago.
- **Configuración de Semillas (Seed)**:
  - Actualización del usuario semilla de pruebas a `test_user_7385770550601504283@testuser.com` para alinear el ecosistema local y la base de datos de PostgreSQL con el Sandbox del usuario Comprador asignado en Mercado Pago.

### Versión 1.10.0 — Auditoría de Seguridad y Despliegue en Nube (Etapa Final)
- **Hardening de Seguridad (Mitigación OWASP)**:
  - **Spoofing y Webhooks**: Implementación de verificación criptográfica (HMAC SHA256) de la cabecera `x-signature` en los webhooks de Mercado Pago para prevenir falsificación de pagos.
  - **CORS Estricto**: Restricción de orígenes permitidos en la API para aceptar peticiones únicamente del frontend local (`localhost:5173`, `3000`) y del dominio de producción provisto por Vercel.
  - **Sanitización y SSRF**: Inclusión de cabeceras de seguridad HTTP globales mediante `Helmet` y validación estricta de formato de URLs en la subida de comprobantes de pago.
  - **Políticas de Contraseña y Enumeración**: Refuerzo de la expresión regular de contraseñas (mínimo 8 caracteres, alfanumérico con mayúsculas) y ofuscación de respuestas en el registro para evitar ataques de enumeración de usuarios.
- **Preparación para Producción Privada (Staging)**:
  - Bloqueo por contraseña de acceso directo en el punto de entrada de React (`main.jsx`) para mantener la confidencialidad de la plataforma durante las pruebas en equipo.
  - El proyecto está ahora preparado para ser hosteado bajo la arquitectura Serverless gratuita: **MongoDB Atlas** (Base de datos), **Render.com** (Node.js API) y **Vercel** (Frontend estático React).

### Versión 1.11.0 — Parches de Seguridad Críticos, Optimización y Accesibilidad (Aramis Prieto)
- **Seguridad Crítica (Fail-Closed en Webhooks)**:
  - Modificación de la verificación de firmas criptográficas de Mercado Pago en [socioSubscriptionController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/socioSubscriptionController.js) para forzar un esquema fail-closed. El servidor ahora detiene el procesamiento en producción si falta la variable de entorno `MP_WEBHOOK_SECRET`.
- **Prevención de Replay Attacks**:
  - Implementación de validación de antigüedad de timestamp (`ts`) en las firmas de webhook de Mercado Pago, rechazando peticiones que excedan una tolerancia horaria de 5 minutos.
- **Transaccionalidad en Inserción de Campañas y Registro**:
  - Envolvimos la creación en PostgreSQL y MongoDB dentro de transacciones Sequelize en [campanaController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/campanaController.js) y [authController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/authController.js). Si ocurre un fallo en MongoDB o perfiles, la transacción se deshace (`rollback`) previniendo datos huérfanos.
- **Rendimiento y Code Splitting**:
  - Aplicación de importación perezosa (`React.lazy` y `<Suspense>`) en [App.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/App.jsx) para los paneles de administración y socio, disminuyendo significativamente la carga del bundle JavaScript inicial.
  - Implementación de paginación (`limit` y `page`) en los listados de noticias y campañas para evitar sobrecarga en la base de datos y la red.
- **Eliminación de Adaptadores Redundantes**:
  - Desinstalación completa de `mysql2` en el backend para aligerar las dependencias en producción.
- **Robustez en Rutas Portables y Mensajes**:
  - Corrección de la ruta absoluta local en [check-users.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/check-users.js) por resoluciones dinámicas portables con ESM path.
  - Sincronización de log de contraseñas de desarrollo de `socio123` a `SocioCoop2026!` en [update-email.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/update-email.js) para evitar confusiones de desarrollo.
- **Accesibilidad y SEO**:
  - Adición de `aria-label` descriptivos en [CampaignCard.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/CampaignCard.jsx) y etiquetas meta Open Graph en [index.html](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/index.html).
- **Seguridad y Mitigación de ReDoS (Denegación de Servicio)**:
  - Sanitización y escape de caracteres especiales de expresiones regulares en las búsquedas en [noticiaController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/noticiaController.js) para prevenir ataques de Catastrophic Backtracking.
- **Robustez en Webhooks de Mercado Pago**:
  - Fortalecimiento de la verificación de firmas criptográficas para fallar de forma segura si no se ha configurado la variable de entorno `MP_WEBHOOK_SECRET` y no está explícitamente activada la bandera de bypass para testing local.
- **Garantías de Consistencia y Transacciones Distribuidas**:
  - Implementación de transacciones de Sequelize en la edición y borrado de campañas en [campanaController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/campanaController.js) para asegurar la consistencia y reversión eventual entre PostgreSQL y MongoDB Atlas.
- **Paginación y Optimización de Listados**:
  - Paginación y búsqueda optimizada de socios en [socioController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/socioController.js) con soporte de retrocompatibilidad.
- **Indexación y Optimización de Base de Datos**:
  - Creación de índices en [PerfilSocio.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/models/PerfilSocio.js) y [PagoCuota.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/models/PagoCuota.js) para optimizar búsquedas por clave y filtrado de periodos.
- **Navegación e Interacción UX (Lenis)**:
  - Adición de `data-lenis-prevent` en el modal flotante de detalles de la campaña en [Home.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/Home.jsx) para solucionar fugas de desplazamiento.
- **Configuración de Despliegue Cross-Origin (Vercel + Render)**:
  - Configuración de la URL de la API en [axios.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/api/axios.js) de forma dinámica utilizando `VITE_API_URL` para evitar errores 404 en producción.
  - Ajuste de cookies HttpOnly en [authController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/authController.js) en producción, cambiando a `sameSite: 'none'` y `secure: true` para habilitar la compartición de sesiones entre dominios cruzados.
- **Resolución de Errores de Construcción (Vite/Rollup)**:
  - Eliminación de la importación y validación de `prop-types` en [CampaignCard.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/CampaignCard.jsx), solucionando el error de resolución de módulos y permitiendo compilar el bundle estático en Vercel de forma exitosa.
- **Optimización de Pintura y Rendimiento de Scroll**:
  - Reemplazo del comportamiento `background-attachment: fixed` sobre el body en [index.css](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/index.css) por un pseudo-elemento fijo en el viewport. Esto elimina la rasterización repetitiva durante el desplazamiento y soluciona el lag visual al hacer scroll.

### Versión 1.12.0 — Estabilidad de Producción y Datos de Prueba Avanzados (Aramis Prieto)
- **Resolución de SPA Routing en Vercel**:
  - Implementación del archivo de configuración `vercel.json` con reglas de reescritura (`rewrites`) globales hacia `index.html`. Esto previene de forma definitiva el error `404 NOT_FOUND` nativo de Vercel al recargar sub-rutas protegidas de la aplicación React.
- **Tolerancia a Entornos de Preview (CORS)**:
  - Modificación de los orígenes permitidos (CORS) en el backend de Render para aceptar peticiones provenientes de dominios dinámicos de Vercel (`*.vercel.app`), garantizando que cualquier Preview Deployment funcione en perfecta integración con la base de datos de producción sin ser bloqueado.
- **Inyección de Datos (Seed) Avanzada**:
  - Refactorización de `seed.js` para automatizar la creación de una base de datos de prueba rica y realista en la nube.
  - Inclusión de 5 campañas con diversos estados financieros y 4 noticias con testimonios e imágenes reales.
  - Ampliación del padrón con 6 socios de prueba interactivos (activos y pendientes) y generación del usuario Sandbox oficial de Mercado Pago para ensayos financieros.

### Versión 1.13.0 — Refactorización, Optimización de Caché y Estabilidad en Pruebas (Aramis Prieto)
- **Limpieza de Archivos de Bloqueo Redundantes**:
  - Eliminación completa de `package-lock.json` en frontend y backend para delegar de forma exclusiva la gestión de dependencias a `pnpm` y prevenir inconsistencias de dependencias.
- **Optimización de Serialización en Caché (Mashup)**:
  - Conversión a objeto plano de los detalles NoSQL mediante `.toObject()` en el controlador de campañas antes de estructurar el JSON. Esto previene errores en tiempo de ejecución (`TypeError`) al intentar clonar estructuras complejas de Mongoose en la caché.
- **Robustez en Transacciones y Rollbacks**:
  - Corrección de la doble llamada a `transaction.rollback()` en el servicio de registro al rechazar DNI duplicados, garantizando códigos de respuesta HTTP 400 y eliminando falsos positivos de errores internos 500.
- **Estabilidad de la Suite de Tests**:
  - Actualización de los tests de autenticación para comprobar la inyección del token JWT en cabeceras a través de cookies `HttpOnly` (`set-cookie`) en lugar de buscar la propiedad en el cuerpo de la respuesta JSON.
  - Sincronización de credenciales de prueba con las directivas de contraseñas robustas (mayúsculas y números obligatorios).
  - Inclusión de 2 nuevos tests en `auth.test.js` para validar el rechazo de contraseñas que violan el formato seguro (sin mayúsculas o sin números).
  - Integración de `BYPASS_WEBHOOK_SIGNATURE` para posibilitar flujos de pruebas de webhook locales sin requerir firmas válidas de producción.
- **Remoción de Importaciones Inactivas**:
  - Limpieza de importaciones inactivas de `donationLimiter` y `validateDonation` en las rutas de campañas.

### Versión 1.14.0 — Proxies de Producción, Sincronización de Sesión e Invalidación de Caché (Aramis Prieto)
- **Proxy Inverso en Vercel para Cookies Same-Origin**:
  - Configuración de reglas de reescritura (`rewrites`) en [vercel.json](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/vercel.json) redirigiendo `/api/*` hacia el servidor backend de Render. Esto permite tratar las cookies de sesión `HttpOnly` como cookies de primer origen (*Same-Site*), eludiendo de raíz las restricciones de navegadores modernos que bloquean cookies de terceros cruzadas (`*.vercel.app` a `*.onrender.com`).
- **Invalidación Proactiva de Caché en Campañas**:
  - Implementación del helper `flushCache` en [cacheMiddleware.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/middleware/cacheMiddleware.js) para vaciar completamente la caché en memoria al realizar operaciones de escritura.
  - Vinculación del vaciado de caché en el controlador de campañas ([campanaController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/campanaController.js)), aprobaciones de transferencias ([donacionController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/donacionController.js)) y pagos procesados por Webhook de Mercado Pago ([socioSubscriptionController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/socioSubscriptionController.js)). Esto asegura que la barra de progreso de recaudación y los totales acumulados en la Home pública se actualicen de forma instantánea al ingresar una donación.
- **Resolución de IP Detrás de Proxies en Backend**:
  - Activación de `app.set('trust proxy', 1)` en [index.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/index.js) de Express. Permite que el middleware de control de tasa (*Rate Limiter*) lea la IP real del cliente en lugar de la IP de los balanceadores de carga de Render o Vercel.
- **Rutas y Webhooks Dinámicos en Mercado Pago**:
  - Refactorización de [mpService.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/services/mpService.js) introduciendo una función auxiliar `getBackendUrl()`. Resuelve de manera jerárquica la variable de entorno `BACKEND_URL`, el túnel dinámico `BACKEND_TUNNEL_URL`, o recurre al puerto local `5001`. Esto flexibiliza el redireccionamiento y notificaciones webhook en diferentes entornos (local, túneles, y producción).
- **Sincronización Dinámica de Sesión en Navbar**:
  - Adición de `location.pathname` como dependencia al efecto de sesión de [Navbar.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/Navbar.jsx) para re-evaluar e impactar instantáneamente el estado del Navbar cuando el usuario navega entre las diferentes vistas de la plataforma.

### Versión 1.15.0 — Consolidación Cloud-Only, Corrección de Redirecciones e Integraciones (Aramis Prieto)
- **Desmantelamiento de Infraestructura Local**:
  - Eliminación del archivo de configuración `docker-compose.yml` de la raíz del proyecto para descartar la instanciación de servicios locales de bases de datos.
  - Purga de las secciones sobre despliegue y flujos de pruebas paso a paso en entornos locales (Localhost) del [README.md](file:///Users/aramisprieto/Documents/cooperadora-hospital1/README.md).
- **Corrección de Redirecciones en Navegación Anónima (Invitado)**:
  - Solución al error que redirigía forzosamente a los usuarios no autenticados hacia `/login?expired=true` al ingresar a páginas públicas. Se optimizó el interceptor de Axios en [axios.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/api/axios.js) para ignorar respuestas de estado 401/403 originadas por el chequeo de sesión del Navbar (`/auth/me`), posibilitando la navegación anónima como invitado en la página de inicio.
- **Portabilidad de Desarrollo y Producción**:
  - Ajuste de compatibilidad para soportar entornos híbridos donde se requiera probar localmente el frontend/backend o usar webhooks con firmas bypass y orígenes CORS locales, mientras que en producción se mantiene la validación estricta y segura.

### Versión 1.16.0 — Nueva Vista de Campañas y Rediseño Premium de Detalles (Santiago Ialungo)

- **Página Independiente de Búsqueda de Campañas**:
  - Creación de [CampaignSearch.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/views/CampaignSearch.jsx) bajo la ruta `/campanas`, ofreciendo un panel dinámico con buscador textual y filtros interactivos por categoría (Equipamiento, Insumos Quirúrgicos, Material Descartable, etc.).
- **Rediseño Completo de Detalle de Campaña**:
  - Implementación de un layout premium de dos columnas en [CampaignDetail.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/views/CampaignDetail.jsx) para la ruta `/campanas/:id`.
  - Eliminación de secciones obsoletas ("Detalle del equipo" / especificaciones técnicas y la línea de tiempo) y optimización del espaciado superior (`pt-24`) para evitar superposición con el Navbar.
  - Reemplazo de la sección "¿Por qué este equipo?" por "Descripción", sincronizada dinámicamente con la propiedad `equipamiento_info` provista por los administradores.
- **Soporte de Carga de Archivos y Exclusiones de Git**:
  - Ajuste en `uploadController.js` para devolver URLs absolutas basadas en el host de la solicitud, permitiendo la resolución correcta de imágenes.
  - Configuración de `.gitignore` para omitir la carpeta de subidas local `backend/uploads/`, previniendo commits accidentales de pruebas locales de imágenes.

### Versión 1.17.0 — Gestión de Socios Inactivos, Iconos de Contacto y Carrusel de Campañas (Thiago Masson)

- **Gestión de Socios Inactivos**:
  - Generalización de la función de aprobación a `handleUpdatePartnerStatus` en [AdminPanel.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/AdminPanel.jsx) para soportar de manera flexible la desactivación (estado `'inactivo'`) y reactivación (estado `'activo'`) de los socios directamente en la grilla del panel de administración.
  - Implementación de confirmación obligatoria (`window.confirm`) antes de desactivar o rechazar un socio.
  - Botonera dinámica en la grilla de socios al lado de sus badges de estado correspondientes.
- **Iconos de Contacto en el Footer**:
  - Reemplazo de los datos escritos de contacto por un bloque de botones de iconos dinámicos y estilizados (`Mail`, `Phone`, `MapPin`) con tooltips interactivos y hover al color de la marca en [Footer.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/components/Footer.jsx).
  - Integración de scroll suave dinámico con Lenis y re-scroll en transiciones de ruta para corregir el comportamiento de los enlaces del footer.
- **Carrusel de Campañas Activas**:
  - Conversión de la tarjeta destacados fija de la Home en un carrusel interactivo en [Home.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/Home.jsx) para mostrar todas las campañas activas.
  - Soporte para gestos táctiles deslizando (`swipe`) en móviles, animación fluida de opacidad en la transición de cambio de campaña, flechas de navegación lateral visibles en celulares (y con hover de grupo en escritorio) y dots indicadores de progreso en la parte inferior.
  - Actualización del botón de donaciones en el Hero para redirigir dinámicamente a la campaña que se esté visualizando en el slide activo.

### Versión 1.18.0 — Auditoría de Frontend, Optimización de Rendimiento y Accesibilidad (Thiago Masson)

- **Optimización de Rendimiento y Renderizado (React)**:
  - Memoización del filtrado de listados en [Home.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/Home.jsx) (`activeCampaigns` y `completedCampaigns`) usando `useMemo` para evitar re-cálculos costosos en cada ciclo de renderizado.
  - Envolvimiento del componente [CampaignCard.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/components/CampaignCard.jsx) con `React.memo` para omitir re-renders de tarjetas cuando el listado de campañas se actualiza pero los datos de la campaña no han cambiado.
  - Extracción de la instanciación de `Intl.NumberFormat` fuera de las vistas y componentes ([CampaignCard.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/components/CampaignCard.jsx) y [Home.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/Home.jsx)) a constantes estáticas del módulo, eliminando la sobrecarga computacional de su creación repetida.
  - Configuración de `loading="lazy"` en las imágenes de tarjetas y modales para posponer la carga de recursos de red hasta que entren en el viewport del usuario.
- **Mejoras de Accesibilidad (a11y) y Semántica**:
  - Incorporación de atributos `aria-label` descriptivos a todos los botones interactivos e iconos sin texto de la aplicación en [Footer.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/components/Footer.jsx) (enlaces de redes/contacto), [CampaignDetail.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/CampaignDetail.jsx) (cerrar modal, copiar alias y copiar CBU), y [Home.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/Home.jsx) (cerrar alertas y mensajes).
  - Mejora semántica en los atributos `alt` de las imágenes de especificaciones técnicas de equipamientos médicos para evitar descriptores mudos como `"Aparato"`.
- **Prevención de Layout Shift (CLS)**:
  - Adición de propiedades físicas estáticas `width={48}` y `height={48}` a la etiqueta del logotipo en [Navbar.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/components/Navbar.jsx) para reservar espacio de renderizado de antemano y evitar saltos de cabecera en la carga.

### Versión 1.19.0 — Migración a Gmail SMTP para Envío de Correos (Kevin Nielsen & Aramis Prieto)

- **Integración de Gmail SMTP**:
  - Reemplazo del simulador Ethereal Email por el servidor de correo de Google (`smtp.gmail.com` en puerto `465` con SSL habilitado `SMTP_SECURE=true`).
  - Configuración y validación del flujo de envío seguro usando Contraseñas de Aplicación (App Passwords) de Google para la cuenta de Gmail autenticada.
  - Sincronización del remitente (`EMAIL_FROM`) con la cuenta de Gmail para evitar rebotes de correo o clasificación como spam.

### Versión 1.20.0 — Re-hosting en Render y Respaldo de Base de Datos (Aramis Prieto)

- **Re-hosting del Backend en Render**:
  - Migración y re-hospedaje de la API de Node.js a un nuevo servicio web en Render (`cooperadora-backend.onrender.com`), tras la pérdida de acceso a la cuenta Render original.
  - Actualización de las reglas de redirección (`rewrites`) en el archivo `vercel.json` del frontend para apuntar al nuevo dominio del backend y conservar la funcionalidad de sesión integrada.
- **Respaldo de Base de Datos en Producción**:
  - Resguardo preventivo del estado previo de la base de datos PostgreSQL en `backend/old_db_backup.json` (conteniendo las tablas de campañas, donaciones, perfiles de socios y usuarios) para garantizar la integridad e impedir la pérdida de datos históricos.

### Versión 1.21.0 — Apartado de Noticias como Ventana Independiente (Santiago Ialungo)

- **Nueva Vista de Búsqueda y Filtros de Noticias**:
  - Creación de [NewsSearch.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/views/NewsSearch.jsx) bajo la ruta `/noticias`, con barra de búsqueda de texto e interactividad mediante chips de categorías dinámicas (`Todas`, `Logro`, `Hospital`, `Transparencia`, `Empresas`, `Institucional`).
  - Tarjetas de noticias responsivas con efectos hover premium y soporte para imágenes reales.
  - Generación de placeholders estéticos con textura de líneas diagonales grises y etiqueta `IMG · [Categoría]` para las noticias que no posean imágenes cargadas, emulando la maqueta de referencia.
  - Sanitización y eliminación de tags HTML para los snippets de las tarjetas.
- **Navegación e Integración**:
  - Actualización del enrutamiento de la aplicación en [App.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/App.jsx) con carga perezosa de la vista de noticias.
  - Modificación de [Navbar.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/components/Navbar.jsx) y [Footer.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/components/Footer.jsx) para redirigir directamente a la página independiente `/noticias` en lugar de scrollear al id de sección del Home.

### Versión 1.22.0 — Ordenamiento de Noticias y Paginación (Santiago Ialungo)

- **Ordenamiento por Fecha en Noticias**:
  - Implementación de un selector de ordenamiento en [NewsSearch.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/views/NewsSearch.jsx) para listar las noticias por "Más recientes" o "Más antiguas".
- **Paginación en el Frontend para Campañas y Noticias**:
  - Incorporación de paginación de 6 elementos por página en las vistas independientes `/campanas` ([CampaignSearch.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/views/CampaignSearch.jsx)) y `/noticias` ([NewsSearch.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/views/NewsSearch.jsx)).
  - Diseño de botonera de paginación adaptativa `< 1 2 3 >` en la parte inferior de los listados cuando superan los 6 elementos.
  - Seteo dinámico para restablecer la página actual a 1 cada vez que cambien los filtros, ordenamiento o términos de búsqueda.

### Versión 1.23.0 — Vista Detallada de Noticias y Ajustes de Inicio (Santiago Ialungo)

- **Ajustes del Listado de Campañas en Inicio**:
  - Remoción de los filtros de búsqueda (`campaignSearchInput`) y selector de ordenamiento (`campaignActiveSort`) de la página de inicio.
  - Limitación visual del grid de campañas activas a las primeras 3 campañas.
  - Incorporación de un botón "Ver más campañas" debajo del grid que navega al buscador independiente `/campanas`.
- **Nueva Vista de Detalle de Noticia (`/noticias/:id`)**:
  - Desarrollo de [NewsDetail.jsx](file:///c:/Users/Santiago/Desktop/cooperadora-hospital1/frontend/src/views/NewsDetail.jsx) para renderizar noticias individuales en una vista premium independiente.
  - Diseño clínico con breadcrumbs, visualizadores estéticos para imágenes ausentes, sidebar de información y un panel inferior de recomendación con 3 noticias recientes.
  - Transición del flujo de "Leer noticia" en la Home y en el Buscador para navegar a esta nueva vista dedicada en lugar de abrir ventanas modales.

### Versión 1.24.0 — Optimización de Bundle, Modularización, Caché Selectiva e Integración Remota (Aramis Prieto)

- **Optimización de Compilación (Code Splitting)**:
  - Configuración de Rollup `manualChunks` en [vite.config.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/vite.config.js) para separar las librerías más pesadas (`recharts`/`d3` en `charts`, y `lucide-react` en `icons`), reduciendo drásticamente el peso del bundle JavaScript principal (`vendor`) y acelerando el tiempo de carga en la nube.
- **Modularización y Aislamiento de Estado**:
  - **Panel de Admin (`AdminPanel.jsx`)**: Extracción de formularios (`PartnerForm`, `CampaignForm`, `NewsForm`) y del módulo de gráficos (`DashboardCharts`) a componentes independientes para eliminar latencias de escritura.
  - **Panel de Socio (`SocioPanel.jsx`)**: Extracción de las secciones de perfil, cuotas y aportes a componentes independientes (`SocioProfile`, `CuotasTab`, `DonacionesTab`).
  - **Búsqueda en Inicio (`Home.jsx`)**: Creación de `NewsSearchForm` para aislar localmente el estado de escritura de la barra de búsqueda de noticias, evitando que toda la Home se re-renderice en cada pulsación de tecla.
- **Centralización de Skeletons**:
  - Creación de [Skeletons.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/Skeletons.jsx) para centralizar animaciones de carga.
  - Creación de `NewsSearchSkeleton` para las tarjetas de noticias independientes y refactorización de [NewsSearch.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/NewsSearch.jsx) para remover su esqueleto inline duplicado y consumirlo desde allí.
- **Caché Selectiva del Backend**:
  - Rediseño de [cacheMiddleware.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/middleware/cacheMiddleware.js) con la nueva función `flushCachePattern(pattern)` que elimina solo las claves que coinciden con un prefijo específico en memoria en lugar de borrar toda la caché del servidor.
  - Actualización de los controladores de campañas, donaciones y Mercado Pago para vaciar selectivamente `/api/campanas`, e inclusión del vaciado de `/api/noticias` en el controlador de novedades tras cambios del administrador.
- **Fusión e Integración de Código**:
  - Resolución de conflictos en [CampaignSearch.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/CampaignSearch.jsx) para integrar de forma limpia la nueva paginación de Santi con la carga asíncrona de skeletons.
  - Resolución y acomodo cronológico de la bitácora de cambios en el archivo [README.md](file:///Users/aramisprieto/Documents/cooperadora-hospital1/README.md).

### Versión 1.25.0 — Estandarización de Seguridad, Robustez y Control de Flujo (Aramis Prieto)
- **Validación y Sanitización en Formularios del Frontend**:
  - Implementación de `.trim()` en inputs de texto, parseo estricto a enteros (`parseInt`) y reales (`parseFloat`), y forzado booleano en `CampaignForm.jsx`, `NewsForm.jsx`, `PartnerForm.jsx`, `SocioProfile.jsx` y `CuotasTab.jsx`.
- **Estandarización de Manejo de Excepciones**:
  - Eliminación de la fuga de trazas internas (`error.message`) hacia los clientes en los bloques `catch` de los controladores del backend, reemplazándolas por respuestas JSON genéricas de error 500.
  - Robustecimiento del formato de parámetros de ruta (`id`) con validaciones de números enteros y formato hexadecimal `ObjectId` de 24 caracteres en `campanaController.js` y `noticiaController.js`.
- **Hardenización de Express y CORS**:
  - Deshabilitación de la cabecera `X-Powered-By` para mitigar recolección de huella tecnológica.
  - Re-estructuración del middleware CORS en `index.js` para endurecer la validación de orígenes en producción, prohibiendo peticiones sin origen y comodines `.vercel.app`.
  - Configuración de `frameguard: { action: 'sameorigin' }` en Helmet para mitigar Clickjacking.
- **Middleware de Límite de Tasa de Transacciones**:
  - Creación del middleware `transactionLimiter` (5 req / 15 min por IP) y su aplicación en la creación de suscripciones y declaraciones de pago del socio en `socioRoutes.js`.

### Versión 1.26.0 — Vista de Obras Concretadas, Armonía Visual y Mejoras de UX (Aramis Prieto)

- **Nueva Vista Independiente: Obras Concretadas (`/obras-concretadas`)**:
  - Creación de [ObrasConcretadas.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/ObrasConcretadas.jsx) bajo la ruta `/obras-concretadas`, exclusiva para campañas que alcanzaron el 100% de su meta de recaudación.
  - Filtrado automático al fetch: se excluyen las campañas activas para que esta vista muestre únicamente los proyectos completados.
  - Dos modos de visualización conmutables: **grilla de tarjetas** y **línea de tiempo** (timeline con nodos emergentes y eje central).
  - Buscador por título y chips de filtro por categoría (Neonatología, Emergencias, Diagnóstico, Terapia Intensiva, Pediatría, Laboratorio, General) con reset automático de página.
  - Tarjetas con badge "100% Logrado", imagen real o gradiente placeholder, métricas de inversión final y navegación a la página de detalle.
  - Sección CTA inferior sobre fondo oscuro con botones explícitamente estilizados para visibilidad en contraste alto.
  - Enlace añadido en [Navbar.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/Navbar.jsx) y [Footer.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/Footer.jsx).

- **Separación Estricta de Campañas Activas y Completadas**:
  - [CampaignSearch.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/CampaignSearch.jsx) ahora filtra client-side las campañas cuyo `monto_actual >= monto_objetivo`, de modo que las campañas completadas **no aparecen** en `/campanas` y quedan exclusivamente en `/obras-concretadas`.

- **Imágenes por Defecto para Campañas y Noticias**:
  - [CampaignCard.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/CampaignCard.jsx): reemplazado el texto monospace `"IMG - Categoría"` por un gradiente oscuro premium (`slate-700 → slate-900`) con ícono de estetoscopio, dot-grid sutil y glow de acento.
  - [NewsSearch.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/NewsSearch.jsx): reemplazado el fondo diagonal con etiqueta de texto por el mismo estilo de gradiente con ícono de periódico para armonía visual.
  - [Home.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/Home.jsx): las tarjetas de noticias en el inicio ahora muestran la imagen real cuando existe y el mismo gradiente de fallback cuando no, unificando el diseño con la vista `/noticias`.

- **Armonía Visual entre Páginas**:
  - Las tarjetas de noticias en la Home adoptaron el mismo diseño que [NewsSearch.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/NewsSearch.jsx): `rounded-[2rem]`, borde, hover, imagen de encabezado.
  - Agregada la clase `.badge-teal` faltante en [index.css](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/index.css), referenciada en el Hero de la Home pero ausente en la hoja de estilos.

- **Corrección de Botones CTA en Obras Concretadas**:
  - Eliminado conflicto de z-index en la sección oscura del CTA. Se añadió `isolate` al contenedor padre y se migró el overlay radial a `opacity` directa.
  - Los botones "Ver Campañas Activas" y "Asociarse Ahora" usan clases inline explícitas en lugar de `btn-brand`/`btn-accent`, garantizando visibilidad correcta sobre fondo `bg-slate-900`.

- **Redirección de Usuarios ya Autenticados (`/login`)**:
  - Creación del componente `GuestRoute` en [App.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/App.jsx) que envuelve la ruta `/login`. Si el usuario ya tiene sesión activa, es redirigido automáticamente: administradores a `/admin` y socios a `/`.
  - Aplica tanto al formulario de login como al de registro (`/login?mode=register`).

- **Exclusión de Carpetas de Configuración del Repositorio**:
  - Agregadas las rutas `.gemini/` y `.agents/` al [.gitignore](file:///Users/aramisprieto/Documents/cooperadora-hospital1/.gitignore) para impedir que metadatos de herramientas de desarrollo sean commiteados accidentalmente.
  - Eliminación del tracking existente mediante `git rm --cached`, preservando los archivos localmente.

- **Eliminación de Tarjetas de Estadísticas en Obras Concretadas**:
  - Removidas las tres tarjetas de métricas automáticas (Equipos & Obras, Inversión Lograda, Participación) de [ObrasConcretadas.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/ObrasConcretadas.jsx) ya que los valores eran estimaciones y podían inducir a error.
  - Limpieza de imports (`Award`, `TrendingUp`, `Users`) y cálculo `useMemo` de estadísticas que quedaron sin uso.

### Versión 1.27.0 — Limpieza de UI, Panel de Administración y Correcciones de Usabilidad (Thiago Masson)
- **Métricas Reales en el Panel de Administración (Dashboard)**:
  - Reemplazo de los datos estáticos de demostración (mock data) en los gráficos del panel de administración por datos reales obtenidos desde el servidor (ingresos acumulados por transferencias aprobadas y registro de nuevos socios de los últimos 6 meses).
- **Limpieza de UI y Ajustes en Obras Concretadas**:
  - Remoción definitiva de la vista de grilla y de los chips de categorías ("Todas"/"General"). Ajuste de la línea de tiempo ([ObrasConcretadas.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/ObrasConcretadas.jsx)) como vista única, corrección del import ausente de `Award` de `lucide-react`, eliminación del badge superior de "Impacto Comunitario", adición del mini título/eyebrow superior "Obras Concretadas" (`text-brand-600`) y estandarización del diseño de la barra de búsqueda (con botón para limpiar búsqueda) para unificarla con la barra de búsqueda de campañas y noticias.
  - En la Home ([Home.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/Home.jsx)), alineación a la izquierda y remoción del color de letras verde esmeralda (`text-emerald-900`) en el encabezado de Obras Concretadas para que respete exactamente el formato de campañas y noticias.
  - Reemplazo del botón condicional de "Ver todos los logros" por el botón incondicional "Ver más obras" con redirección a `/obras-concretadas`.
  - Unificación a color rojo institucional (`text-brand-600`) para los subhead/eyebrows ("Campañas Activas", "Impacto Real", "Novedades Institucionales") arriba de los títulos en cada sección de la Home.
- **Diseño Unificado de Tarjetas de Noticias y Campañas**:
  - Rediseño de las tarjetas de noticias tanto en la Home ([Home.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/Home.jsx)) como en la vista de búsqueda ([NewsSearch.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/NewsSearch.jsx)) para adoptar una estética compacta idéntica al formato de campañas y proyectos (`rounded-3xl`, padding `p-5`, hover `-translate-y-1` y proporción `aspect-[16/10]`).
  - Uso de la utilidad `getPlainTextSnippet` para recortar y renderizar extractos textuales limpios (sin HTML) a un máximo de 90 caracteres con el fin de evitar desajustes visuales y garantizar la uniformidad en el diseño.
  - Ocultamiento definitivo del buscador de noticias y del badge "Transparencia Total" en la Home para mayor claridad visual.
  - Limitación de la visualización en el inicio a los 3 artículos de noticias más recientes y adición del botón "Ver más noticias" con redirección a `/noticias`.
- **Alineación de Fechas en Detalle de Noticias**:
  - Corrección de la alineación y espaciado de los detalles de publicación en el sidebar de [NewsDetail.jsx](file:///c:/Users/masso/OneDrive/Escritorio/cooperadora-hospital1/frontend/src/views/NewsDetail.jsx) para prevenir la superposición de fechas largas (uso de `items-start`, `shrink-0` y alineación `text-right`).
  - Remoción total del bloque de tags/etiquetas al pie del artículo según la preferencia del usuario.
- **Protección contra Bucle de Redirecciones**:
  - Limpieza automática de las claves `user` y `token` del `localStorage` en [Navbar.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/Navbar.jsx) ante respuestas de estado 401 por expiración o invalidez de sesión, previniendo bucles infinitos de redirección provocados por la protección de `GuestRoute`.

### Versión 1.28.0 — Gestión Centralizada del Monorepo con pnpm Workspaces (Antigravity)
- **Monorepo Unificado y pnpm Workspaces**:
  - Creación de [pnpm-workspace.yaml](file:///Users/aramisprieto/Documents/cooperadora-hospital1/pnpm-workspace.yaml) y configuración del espacio de trabajo unificando los proyectos de `frontend` y `backend` bajo una misma gestión de dependencias.
  - Creación de [package.json](file:///Users/aramisprieto/Documents/cooperadora-hospital1/package.json) en la raíz para definir scripts globales simplificados de desarrollo y pruebas.
- **Scripts Centralizados y Concurrencia**:
  - Configuración del script `pnpm dev` en la raíz para iniciar concurrentemente y con un solo comando los servidores de desarrollo de frontend (Vite) y backend (Node/Express) mediante `concurrently`.
  - Configuración de `pnpm test` en la raíz para ejecutar de manera directa la suite de 26 pruebas de la interfaz de frontend.
- **Pruebas y Robustez de Sesión**:
  - Creación de pruebas unitarias específicas en [Navbar.test.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/Navbar.test.jsx) para certificar que el almacenamiento local se limpia de manera efectiva al cerrar sesión o al recibir errores de sesión expirada.
  - Implementación de un mock robusto de `localStorage` en [setupTests.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/setupTests.js) para evitar warnings de Node y fallos en entornos automatizados.

### Versión 1.29.0 — Compartido Rápido con Vista Previa y Feedback de Copiado (Antigravity)
- **Módulo de Compartido Rápido (`ShareModal`)**:
  - Creación de [ShareModal.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/ShareModal.jsx) con plantilla visual de previsualización de tarjeta, botones rápidos para WhatsApp, Facebook, X (Twitter) y Telegram, y feedback de copiado al portapapeles ("¡Copiado!") con toast e indicación de estado.
  - Creación de pruebas unitarias y de accesibilidad en [ShareModal.test.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/ShareModal.test.jsx) usando `vitest` y `jest-axe`, garantizando cumplimiento de las pautas de accesibilidad WCAG.
- **Integración en Campañas y Noticias**:
  - Integración del modal de compartir en el detalle de campañas ([CampaignDetail.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/CampaignDetail.jsx)).
  - Adición del botón lateral "Compartir publicación" e integración del modal en el detalle de noticias ([NewsDetail.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/NewsDetail.jsx)).

