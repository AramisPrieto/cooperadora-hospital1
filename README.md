# 🏥 Cooperadora del Hospital Municipal "Dr. Emilio Ferreyra" (Necochea)
### Trabajo Final Integrador (TFI) — Programación IV (Etapa 4)
**Universidad Tecnológica Nacional (UTN) — Extensión Áulica Necochea**

---

## 👥 Integrantes del Grupo
* **Aramis Prieto**
* **Kevin Nielsen**
* **Thiago Masson**
* **Santiago Ialungo**

**Profesor:** Ing. Hernández Gauna, Jorge G.

---

## 📋 Resumen del Proyecto y Etapas

Este proyecto consiste en el diseño e implementación de un portal web integral y seguro para la **Asociación Cooperadora del Hospital Municipal de Necochea**. Su objetivo es digitalizar la captación y administración de socios, visibilizar de forma transparente el destino de las donaciones por medio de campañas de recaudación y publicar novedades institucionales.

### 🔄 Historial de Etapas Desarrolladas:
* **Etapa 1: Investigación y Análisis:** Análisis situacional de la institución, diagnóstico de las necesidades de centralización y digitalización de pagos, estructuración del modelo de navegación y definición del público objetivo (vecinos de Necochea y Quequén).
* **Etapa 2: Diseño de Wireframes:** Creación de maquetas estáticas en HTML que definen la jerarquía visual de la plataforma (Home, Login, Área Restringida y Buscador).
* **Etapa 3: Análisis de Datos y Arquitectura de Backend:** Diseño del esquema híbrido de datos, análisis de alternativas de persistencia (SQL relacional y NoSQL documental) y definición técnica de la comunicación mediante APIs seguras.
* **Etapa 4: Diseño e Implementación de las API y Prototipo (Etapa Final):** Desarrollo del backend y frontend del portal web interactivo con persistencia híbrida, seguridad JWT y rate limiters, panel administrativo, flujo de aprobación de transferencias bancarias, y envío de correos SMTP. Para un desglose de todos los cambios de esta etapa y su evolución cronológica por versión, consulte la sección **[Historial de Cambios](#-historial-de-cambios)**.

---

## 🏗️ Arquitectura Híbrida de Persistencia

Para optimizar el rendimiento y garantizar la consistencia, implementamos una **Arquitectura de Datos Híbrida**:

```mermaid
graph TD
    Cliente[Cliente: React App] -->|HTTPS + JWT| Backend[API Gateway: Node/Express]
    Backend -->|Transaccional ACID| SQL[(SQL: PostgreSQL / MySQL)]
    Backend -->|Esquema Flexible| NoSQL[(NoSQL: MongoDB)]
    
    subgraph Base SQL
        SQL -->|Tabla| users[usuarios]
        SQL -->|Tabla| members[perfiles_socios]
        SQL -->|Tabla| campaigns[campanas_eco]
    end
    
    subgraph Base NoSQL
        NoSQL -->|Colección| news[noticias_actualidad]
        NoSQL -->|Colección| enrich[campanas_detalle]
    end
```

### 1. Motor Relacional (SQL: PostgreSQL / MySQL)
Resguarda los datos sensibles que exigen trazabilidad estricta y consistencia **ACID**:
* **`usuarios`**: Credenciales de acceso (emails únicos, contraseñas hasheadas con `bcryptjs` y roles `admin` o `socio`).
* **`perfiles_socios`**: Datos obligatorios del Libro Registro de Asociados (DNI únicos, fechas de alta y estado de aprobación).
* **`campanas_eco`**: Control de metas financieras (monto objetivo y monto acumulado real no negativos).

### 2. Motor Documental (NoSQL: MongoDB con Mongoose)
Almacena documentos de formato libre de alta carga multimedia:
* **`noticias_actualidad`**: Publicaciones con galerías fotográficas, videos y tags dinámicos.
* **`campanas_detalle`**: Complemento de narrativa enriquecida para campañas (testimonios, estado de ejecución de obras y arrays de videos/imágenes) vinculados dinámicamente mediante `campana_id_ref`.

### ⚛️ Transacciones ACID y Concurrencia en Donaciones

El endpoint `POST /api/campanas/:id/donar` utiliza una transacción SQL con **bloqueo de fila** (`SELECT ... FOR UPDATE`) para garantizar consistencia bajo carga concurrente:

1. Se abre una transacción Sequelize.
2. Se adquiere un lock exclusivo sobre la fila de la campaña (`lock: transaction.LOCK.UPDATE`).
3. Se actualiza el `monto_actual` y se hace commit.
4. Cualquier otra donación simultánea sobre la misma campaña espera en cola hasta que la transacción anterior libere el lock.

Esto evita la condición de carrera donde dos donaciones simultáneas leen el mismo valor y sobreescriben la suma del otro.

### 🔄 Fusión Sincrónica: Data Mashup
Cuando un usuario ingresa a ver los detalles de una campaña completa (`GET /api/campanas/:id`), el backend utiliza `Promise.all` para ejecutar de manera paralela y sincrónica dos consultas:
1. Una consulta por clave primaria en SQL para obtener las finanzas de `campanas_eco`.
2. Una consulta documental en MongoDB para obtener la narrativa multimedia de `campanas_detalle`.

Ambas respuestas se ensamblan en un único objeto JSON unificado que se envía al cliente, reduciendo la latencia de red y optimizando la carga en el frontend.

---

## 🚀 Instrucciones para Levantar el Proyecto Localmente

### 📋 Prerrequisitos
Tener instalado en su sistema local:
* **Node.js** (v18 o superior)
* **pnpm** (v8 o superior)
* Una instancia activa de **PostgreSQL** o **MySQL**.
* Una instancia activa de **MongoDB**.

---

### 🔧 Paso 1: Configurar el Backend
1. Navegar a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Instalar todas las dependencias:
   ```bash
   pnpm install
   ```
3. Crear el archivo `.env` a partir de la plantilla:
   ```bash
   cp .env.example .env
   ```
4. Configurar las variables de entorno dentro del archivo `.env` recién creado:
   * `DATABASE_URL`: URI de conexión a su base SQL (ej: `postgres://usuario:pass@localhost:5432/cooperadora_db`).
   * `MONGODB_URI`: URI de conexión a su MongoDB (ej: `mongodb://localhost:27017/cooperadora_nosql`).
   * `JWT_SECRET`: Llave secreta para firmar tokens (usar una cadena aleatoria larga en producción).
   * `PORT`: Puerto del servidor backend. **Debe ser `5001`** para que el proxy de Vite funcione correctamente.
5. Iniciar el servidor backend en modo desarrollo (nodemon):
   ```bash
   pnpm dev
   ```
   *El servidor compilará y sincronizará automáticamente las tablas relacionales de SQL y escuchará en el puerto 5001 (`http://localhost:5001`).*

---

### 🎨 Paso 2: Configurar el Frontend
1. Abrir otra terminal y navegar al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instalar dependencias del cliente:
   ```bash
   pnpm install
   ```
3. Iniciar el servidor de desarrollo de Vite:
   ```bash
   pnpm dev
   ```
   *Vite levantará la aplicación frontend en `http://localhost:3000` con proxy reverso automático hacia el puerto 5001 para evitar bloqueos por CORS.*

---

### 🧪 Paso 3: Ejecutar las Pruebas Automatizadas
Para ejecutar la suite de pruebas unitarias y de integración del backend:
1. Asegurar que los contenedores de base de datos estén corriendo (`docker-compose up -d`). El helper de pruebas creará y limpiará automáticamente las bases de datos de prueba (`cooperadora_db_test` y `cooperadora_nosql_test`).
2. Navegar a la carpeta del backend:
   ```bash
   cd backend
   ```
3. Ejecutar las pruebas:
   ```bash
   pnpm test
   ```
   *Vitest ejecutará los 47 tests secuencialmente garantizando la coherencia y el aislamiento de datos.*

---

## 🔐 Seguridad: Gestión de Roles de Administrador

El endpoint público `POST /api/auth/register` **siempre crea usuarios con rol `socio`**. No es posible auto-asignarse el rol `admin` desde el formulario de registro.

Las cuentas de administrador deben crearse **directamente en la base de datos SQL**, ejecutando una sentencia similar a:

```sql
-- 1. Insertar el usuario admin con contraseña hasheada (generar el hash previamente con bcrypt)
INSERT INTO usuarios (email, password_hash, rol)
VALUES ('admin@cooperadora.org', '$2a$10$...hash...', 'admin');
```

> **Nota:** Para generar el `password_hash` se puede usar un script Node.js con `bcryptjs` o una herramienta online de bcrypt. Nunca almacenar contraseñas en texto plano.

---

## 🛠️ Comandos Git Utilizados (Estructura de Trabajo)
Para mantener un orden profesional en el repositorio, la estructura de ramas se inicia en `develop`:
```bash
# Inicializar repositorio local
git init

# Agregar todos los archivos estructurados (filtrados por .gitignore)
git add .

# Hacer el primer commit
git commit -m "feat: inicializar backend y frontend híbrido para Etapa 4"

# Crear y cambiarse a la rama de desarrollo
git checkout -b develop
```

---

## 📋 Historial de Cambios

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
  - Adición de las columnas `cant_cambios_metodo_pago` y `mes_ultimo_cambio_metodo_pago` en [PerfilSocio.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/models/PerfilSocio.js).
  - Implementación de validaciones a nivel de backend en [socioController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/socioController.js) para limitar las actualizaciones de método de pago a un máximo de 3 por mes para los socios. Los administradores están exentos de esta restricción.
  - Inclusión de diálogos de confirmación del navegador (`window.confirm`) en el panel de socios de [SocioPanel.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/SocioPanel.jsx) antes de actualizar el medio de pago, capturando y desplegando adecuadamente los errores de validación HTTP 400.
- **Donaciones en Línea para Campañas**:
  - Integración del botón y pestaña de pago online con **Mercado Pago** en el modal de detalles de campañas en [Home.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/Home.jsx), incluyendo redirecciones seguras y alertas globales de éxito o fallo (`donation_success`/`donation_failure`).
  - Creación del endpoint `POST /api/donaciones/campanas/:id/donar-mp` y su correspondiente controlador en [donacionController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/donacionController.js) para generar preferencias de pago seguro.
  - Ampliación del webhook de Mercado Pago en [socioSubscriptionController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/socioSubscriptionController.js) para detectar transacciones con formato de referencia externa `donation_u{userId}_c{campanaId}`, registrar aportes confirmados, actualizar de forma segura y concurrente el monto acumulado de la campaña con bloqueo de fila (`LOCK.UPDATE`), y despachar correos electrónicos SMTP de agradecimiento.
- **Robustez de Entorno y Pruebas**:
  - Incorporación de 6 nuevas pruebas de integración automatizadas en las suites [socio.test.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/tests/socio.test.js) and [donacion.test.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/tests/donacion.test.js), elevando a 79 el total de casos exitosos.
  - Configuración de la directiva `server.allowedHosts: true` en [vite.config.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/vite.config.js) para facilitar el testeo remoto y compatibilidad con túneles HTTPS de desarrollo.
