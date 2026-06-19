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

## 🔒 Seguridad e Integración de Middleware

* **JWT (JSON Web Tokens):** Las sesiones se administran de forma segura con tokens firmados guardados o enviados en las cabeceras HTTP.
* **Rate Limiting:** Se controlan los excesos de peticiones por IP usando `express-rate-limit` con límites restrictivos en donaciones (`donationLimiter`), transacciones (`transactionLimiter`) y autenticación (`authLimiter`).
* **Caché en Memoria:** El middleware `cacheMiddleware.js` cachea endpoints de consulta frecuente. La caché se invalida selectivamente por patrones de rutas específicas (`flushCachePattern`) al realizar modificaciones, asegurando visualización instantánea.

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
