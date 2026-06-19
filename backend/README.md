# 🖥️ Backend API — Cooperadora Hospital Dr. Emilio Ferreyra

Este directorio contiene el servidor de la API REST que proporciona la lógica de negocio, autenticación, control de seguridad y persistencia híbrida de datos para la Asociación Cooperadora.

---

## 📂 Estructura de Directorios

La arquitectura del backend sigue una separación limpia de responsabilidades:

```text
backend/
├── config/             # Conexión y configuración de bases de datos
│   ├── db.js           # Configuración de base de datos relacional (Sequelize - MySQL/Postgres)
│   └── mongo.js        # Configuración de base de datos documental (Mongoose - MongoDB)
├── controllers/        # Controladores con la lógica de negocio (Capa de Control)
│   ├── authController.js       # Autenticación y registro de usuarios
│   ├── campanaController.js    # Creación y gestión de campañas de recaudación
│   ├── donacionController.js   # Procesamiento de transferencias y webhooks de Mercado Pago
│   ├── noticiaController.js    # Publicación y administración de novedades
│   ├── socioController.js      # Gestión de solicitudes, datos de perfil y aprobación de socios
│   ├── socioSubscriptionController.js # Cobro de cuotas mensuales automáticas (Mercado Pago)
│   └── uploadController.js     # Procesamiento y guardado de archivos adjuntos
├── middleware/         # Filtros y validaciones previas a los controladores
│   ├── auth.js         # Verificación de JWT y autorización basada en roles (admin/socio)
│   ├── cacheMiddleware.js # Caché selectivo en memoria (node-cache) con invalidación
│   ├── rateLimiter.js  # Límites de tasa por IP contra ataques de fuerza bruta y DoS
│   └── validators.js   # Esquemas de validación de datos usando express-validator
├── models/             # Definición de esquemas y modelos de persistencia (Capa de Modelo)
│   ├── index.js        # Asociación de modelos relacionales en Sequelize
│   ├── Usuario.js      # Credenciales y roles en SQL
│   ├── PerfilSocio.js  # Registro de datos del asociado en SQL
│   ├── CampanaEco.js   # Datos financieros transaccionales en SQL
│   ├── PagoCuota.js    # Historial de pagos mensuales de socios en SQL
│   ├── DonacionTransferencia.js # Declaración de transferencias bancarias en SQL
│   ├── CampanaDetalle.js # Narrativa multimedia de campañas en MongoDB
│   └── NoticiaActualidad.js # Publicación de noticias y galerías en MongoDB
├── routes/             # Enrutamiento de endpoints expuestos
├── services/           # Servicios y clientes externos (SMTP, Mercado Pago SDK)
├── tests/              # Pruebas unitarias y de integración de la API (Vitest + Supertest)
└── uploads/            # Directorio temporal de almacenamiento de imágenes locales
```

---

## 🏗️ Arquitectura Híbrida de Persistencia

Para optimizar la consistencia y flexibilidad del sistema, se utiliza una arquitectura de base de datos dual:

1. **Relacional (SQL - PostgreSQL/MySQL):**
   * Gestionado mediante **Sequelize**.
   * Resguarda información crítica transaccional (usuarios, credenciales, perfiles de socios oficiales, historial de pagos de cuotas y saldos de campañas).
   * Implementa **bloqueos de fila** (`SELECT ... FOR UPDATE`) en el procesamiento de donaciones concurrente para prevenir condiciones de carrera.

2. **NoSQL (Documental - MongoDB):**
   * Gestionado mediante **Mongoose**.
   * Almacena datos con alta variabilidad estructural y multimedia (noticias con galerías de imágenes, testimonios y descripción extendida de campañas).

### Data Mashup
En endpoints como `GET /api/campanas/:id`, el backend combina de forma transparente datos relacionales (monto acumulado y meta) con datos documentales (narrativa y videos) usando `Promise.all` para ejecutar las consultas en paralelo, retornando un objeto JSON unificado.

---

## 🗄️ Diccionario del Esquema de Datos Híbrido

### 1. Base de Datos Relacional (SQL: PostgreSQL / MySQL)

#### Tabla: `usuarios`
Resguarda los datos de inicio de sesión y privilegios.
| Campo | Tipo | Nulidad | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `NOT NULL` | Llave primaria, auto-incremental. |
| `email` | `VARCHAR(255)` | `NOT NULL` | Único. Correo electrónico del usuario. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Contraseña cifrada con `bcryptjs`. |
| `rol` | `ENUM('socio', 'admin')` | `NOT NULL` | Por defecto `'socio'`. |
| `reset_password_token` | `VARCHAR(255)` | `NULL` | Token temporal único para restablecer la contraseña. |
| `reset_password_expires` | `TIMESTAMP` | `NULL` | Fecha y hora límite de expiración del token. |

#### Tabla: `perfiles_socios`
Registra los datos oficiales de los asociados al padrón.
| Campo | Tipo | Nulidad | Descripción |
| :--- | :--- | :--- | :--- |
| `numero_asociado` | `INTEGER` | `NOT NULL` | Llave primaria, auto-incremental. |
| `usuario_id_fk` | `INTEGER` | `NOT NULL` | Llave foránea que apunta a `usuarios.id` (Relación 1:1). |
| `dni` | `INTEGER` | `NOT NULL` | Único. Número de documento. |
| `nombre` | `VARCHAR(255)` | `NOT NULL` | Nombre del socio. |
| `apellido` | `VARCHAR(255)` | `NOT NULL` | Apellido del socio. |
| `direccion` | `VARCHAR(255)` | `NOT NULL` | Dirección residencial. |
| `localidad` | `VARCHAR(100)` | `NOT NULL` | Localidad de residencia. |
| `nacionalidad` | `VARCHAR(100)` | `NOT NULL` | Nacionalidad. |
| `telefono` | `VARCHAR(50)` | `NOT NULL` | Teléfono de contacto. |
| `fecha_nacimiento`| `DATE` | `NOT NULL` | Fecha de nacimiento. |
| `genero` | `ENUM('masculino', 'femenino', 'otro')` | `NOT NULL` | Género del asociado. |
| `metodo_pago` | `ENUM('transferencia', 'efectivo', 'cobrador', 'debito')` | `NOT NULL` | Método de cobro seleccionado. |
| `estado` | `ENUM('activo', 'pendiente', 'inactivo')` | `NOT NULL` | Por defecto `'pendiente'`. |
| `monto_cuota` | `DECIMAL(12,2)` | `NULL` | Valor asignado de cuota social mensual. |
| `fecha_ultimo_pago`| `DATE` | `NULL` | Fecha registrada del último cobro acreditado. |
| `mp_preapproval_id`| `VARCHAR(255)`| `NULL` | ID de pre-aprobación de suscripción en MP. |
| `mp_subscription_status`| `VARCHAR(255)`| `NULL` | Estado actual de la suscripción. |
| `cant_cambios_metodo_pago`| `INTEGER`| `NOT NULL` | Contador (Máximo 2 cambios permitidos por período). |

#### Tabla: `campanas_eco`
Maneja las metas financieras de recaudación.
| Campo | Tipo | Nulidad | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `NOT NULL` | Llave primaria, auto-incremental. |
| `titulo` | `VARCHAR(255)` | `NOT NULL` | Título de la campaña. |
| `monto_objetivo` | `DECIMAL(12,2)` | `NOT NULL` | Meta económica mínima a recaudar. |
| `monto_actual` | `DECIMAL(12,2)` | `NOT NULL` | Dinero acumulado (Por defecto `0.00`). |
| `fecha_limite` | `TIMESTAMP` | `NULL` | Fecha límite para recibir aportes. |
| `activo` | `BOOLEAN` | `NOT NULL` | Si la campaña está activa (Defecto `true`). |
| `es_campana_del_mes`| `BOOLEAN` | `NOT NULL` | Flag de visualización destacada (Defecto `false`). |

#### Tabla: `donaciones_transferencia`
| Campo | Tipo | Nulidad | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `NOT NULL` | Llave primaria, auto-incremental. |
| `usuario_id` | `INTEGER` | `NOT NULL` | Foránea apuntando a `usuarios.id`. |
| `campana_id` | `INTEGER` | `NOT NULL` | Foránea apuntando a `campanas_eco.id`. |
| `monto` | `DECIMAL(12,2)` | `NOT NULL` | Valor transferido. |
| `estado` | `ENUM('pendiente', 'aprobada', 'rechazada')` | `NOT NULL` | Por defecto `'pendiente'`. |
| `referencia_interna`| `UUID` | `NOT NULL` | Identificador único de transacción autogenerado. |
| `numero_comprobante`| `VARCHAR(255)`| `NULL` | Número de transacción bancaria cargado por el socio. |
| `comprobante_url`| `VARCHAR(255)`| `NULL` | Enlace al archivo adjunto del comprobante. |

### 2. Base de Datos Documental (NoSQL: MongoDB)

#### Colección: `campanas_detalle`
Almacena narrativa enriquecida y contenidos multimedia de campañas. Referencia SQL mediante `campana_id_ref`.

#### Colección: `noticias_actualidad`
Maneja las novedades y eventos publicados en el portal.

---

## 🔒 Seguridad e Integración de Middleware

* **JWT (JSON Web Tokens):** Las sesiones se administran de forma segura con tokens firmados guardados o enviados en las cabeceras HTTP.
* **Rate Limiting:** Se controlan los excesos de peticiones por IP usando `express-rate-limit` con límites restrictivos en donaciones (`donationLimiter`), transacciones (`transactionLimiter`) y autenticación (`authLimiter`).
* **Caché en Memoria:** El middleware `cacheMiddleware.js` cachea endpoints de consulta frecuente. La caché se invalida selectivamente por patrones de rutas específicas (`flushCachePattern`) al realizar modificaciones, asegurando visualización instantánea.

---

## 🚦 Referencia Completa de la API REST

Toda la comunicación con el backend se realiza bajo el prefijo `/api`. Las peticiones que requieren inicio de sesión deben adjuntar la cabecera `Authorization: Bearer <jwt_token>` o utilizar la cookie de sesión configurada.

### 🔐 Módulo de Autenticación (`/api/auth`)
* `POST /api/auth/register`: Registro de usuario y socio. Payload con email, password, dni, nombre, apellido, dirección, localidad, nacionalidad, teléfono, fecha_nacimiento, genero y metodo_pago. (Envía mail de bienvenida).
* `POST /api/auth/login`: Autenticación de usuario. Retorna token y datos de usuario.
* `GET /api/auth/me`: Retorna los datos del usuario autenticado actual.
* `POST /api/auth/logout`: Finaliza la sesión actual.
* `POST /api/auth/forgot-password`: Genera token de un solo uso de recuperación y despacha mail con enlace seguro. Payload con `email`.
* `POST /api/auth/reset-password`: Valida el token temporal y actualiza la contraseña del usuario. Payload con `token` y `password`.

### 🏥 Módulo de Gestión de Socios (`/api/socios`)
* `GET /api/socios/mi-perfil`: Retorna el perfil completo del socio autenticado.
* `GET /api/socios/mi-perfil/cuotas`: Retorna el historial de cuotas emitidas de este socio.
* `GET /api/socios/mi-perfil/pagos`: Historial de declaraciones de pago.
* `POST /api/socios/mi-perfil/pagos/declarar`: Permite subir comprobante y declarar pago de cuota.
* `POST /api/socios/suscripcion/crear`: Inicia la suscripción en Mercado Pago y retorna initPoints.
* `POST /api/socios/suscripcion/cancelar`: Cancela suscripción activa en Mercado Pago.
* `PUT /api/socios/mi-perfil`: (Autogestión) Permite que el socio actualice sus propios datos personales (DNI, teléfono, dirección, etc.).
* `PUT /api/socios/:id`: (Solo Admin) Actualiza datos completos y estado de aprobación de cualquier socio. (Envía un correo de confirmación al socio si el estado cambia a `'activo'`).
* `GET /api/socios`: (Admin) Listado de socios registrados.
* `POST /api/socios`: (Admin) Registro manual de un socio.
* `DELETE /api/socios/:id`: (Admin) Elimina un socio.

### 📢 Módulo de Campañas y Donaciones (`/api/campanas`, `/api/donaciones`)
* `GET /api/campanas`: Listado de campañas (soporta ordenamientos `sort=urgente|cercana|mayor_meta` y búsquedas).
* `GET /api/campanas/:id`: Detalle completo unificado SQL + NoSQL de una campaña.
* `POST /api/campanas`: (Admin) Creación de nueva campaña (SQL y MongoDB en transacción).
* `PUT /api/campanas/:id`: (Admin) Modifica datos financieros o narrativa.
* `DELETE /api/campanas/:id`: (Admin) Elimina campaña de ambas bases de datos.
* `POST /api/donaciones/campanas/:id/donar-transferencia`: Declara pago de transferencia para una campaña.
* `POST /api/donaciones/campanas/:id/donar-mp`: Genera preferencia de Mercado Pago para donar a la campaña.
* `GET /api/donaciones/mis-donaciones`: Lista historial de donaciones del socio actual.
* `GET /api/donaciones/transferencias`: (Admin) Listado de transferencias declaradas.
* `PUT /api/donaciones/transferencias/:id/aprobar`: (Admin) Aprueba transferencia e impacta recaudación de campaña (envía correo).
* `PUT /api/donaciones/transferencias/:id/rechazar`: (Admin) Rechaza transferencia.

### 📢 Módulo de Noticias/Novedades (`/api/noticias`)
* `GET /api/noticias`: Retorna listado de noticias.
* `GET /api/noticias/:id`: Retorna detalle de una noticia individual (MongoDB).
* `POST /api/noticias`: (Admin) Publica una nueva noticia.
* `PUT /api/noticias/:id`: (Admin) Edita una noticia existente.
* `DELETE /api/noticias/:id`: (Admin) Elimina una noticia.

### 📁 Módulo de Archivos y Webhooks
* `POST /api/uploads`: Sube un archivo (tipo imagen o comprobante) y retorna el path local.
* `POST /api/webhooks/mercadopago`: Recibe notificaciones asíncronas de pagos/suscripciones (con firma HMAC).

---

## 🛠️ Comandos de Desarrollo y Pruebas (pnpm)

*Por favor, ejecuta estos comandos dentro de la carpeta `/backend` o a través del filtro de pnpm en la raíz del proyecto:*

* **Iniciar en modo desarrollo:**
  ```bash
  pnpm run dev
  ```
  *(Inicia el servidor utilizando `nodemon` para reiniciarse automáticamente ante cualquier cambio de código).*

* **Ejecutar suite de pruebas una sola vez:**
  ```bash
  pnpm run test
  ```

* **Ejecutar pruebas en modo observador (watch):**
  ```bash
  pnpm run test:watch
  ```

---

## 🔍 Solución de Problemas Comunes (Troubleshooting)

### 1. Error de conexión SSL con la base de datos SQL (`SequelizeConnectionError`)
* **Causa:** Las bases de datos de producción (como Render PostgreSQL) exigen conexiones cifradas SSL.
* **Solución:** El archivo [db.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/config/db.js) fuerza automáticamente el cifrado SSL si la URL de conexión contiene `render.com`. Si usas otra nube y experimentas fallos de conexión por certificado, asegúrate de configurar la variable `DB_CA_CERT` o activar el modo tolerante en desarrollo local configurando `DATABASE_URL` sin SSL.

### 2. Conflicto de puertos (`Error: listen EADDRINUSE: address already in use :::5000`)
* **Causa:** Hay otra instancia del backend corriendo en segundo plano o el puerto 5000 está ocupado por AirPlay Receiver en macOS.
* **Solución:**
  * Libera el puerto en terminal: `lsof -i :5000` y elimina el proceso con `kill -9 <PID>`.
  * Alternativamente, cambia el puerto de escucha configurando `PORT=5001` (o cualquier otro) en tu archivo `.env` del backend.

### 3. Webhook de Mercado Pago retorna 401/403 en producción
* **Causa:** Error al validar la firma HMAC SHA256 enviada por Mercado Pago.
* **Solución:** Verifica que la variable `MP_WEBHOOK_SECRET` en la configuración de Render coincida exactamente con la clave provista en el panel de desarrolladores de Mercado Pago. En desarrollo local, asegúrate de que el túnel de reenvío (`BACKEND_TUNNEL_URL`) esté bien configurado en el archivo `.env` para que Mercado Pago pueda enviar la notificación.

### 4. Caídas del controlador por inyecciones NoSQL
* **Causa:** Intentos de inyección enviando objetos JSON con operadores de MongoDB (como `{"$gt": ""}`).
* **Solución:** El backend implementa `express-mongo-sanitize` a nivel global en [index.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/index.js), el cual remueve de forma automática caracteres especiales de `req.body`, `req.params` y `req.query`, neutralizando este vector de ataque.
