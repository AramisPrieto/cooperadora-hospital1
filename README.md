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
* **Etapa 4: Diseño e Implementación de las API y Prototipo (Etapa Actual):**
  - Desarrollo de APIs CRUD completas en Node.js y Express.
  - Implementación de seguridad estricta mediante **JSON Web Tokens (JWT)** para garantizar el *Cero Anonimato* en interacciones privadas.
  - Creación del esqueleto interactivo del frontend en **React (Vite) + Tailwind CSS** (Home, Login/Registro, y Panel Administrativo).
  - Integración sincrónica **Data Mashup** para la unificación de datos transaccionales y multimedia.
  - Flujo de redirección post-login inteligente: si un usuario anónimo intenta ver los detalles de una campaña, es redirigido al Login con `?redirect=campana&id=X`. Al autenticarse, navega a `/?view=X` y el Home abre el modal automáticamente, sin recargas de página.
  - Panel Administrativo con gestión completa de Noticias (crear, editar, eliminar) directamente sobre MongoDB, con soporte de tags y contenido HTML.
  - Sanitización de HTML con **DOMPurify** en el renderizado de noticias para prevenir ataques XSS.
  - Corrección de todos los atributos JSX de `class=` a `className=` en los 6 componentes del frontend (303 ocurrencias).
  - Card del Hero conectada a datos reales: muestra la primera campaña activa con título, porcentaje de progreso y montos dinámicos. Incluye skeleton de carga y estado vacío.
  - Panel Administrativo con protección contra acciones duplicadas: todos los botones de mutación (aprobar socio, editar/eliminar campaña, editar/eliminar noticia) se deshabilitan mientras una operación está en curso.

### ✨ Mejoras Recientes de UI/UX (Rediseño Clínico)
- **Migración Estética:** Transición de un diseño oscuro/tecnológico a una apariencia **clínica, institucional y profesional**, optimizando la confianza del usuario.
- **Paleta de Colores Renovada:** Uso de fondos claros (`slate-50`) con acentos estratégicos en rojo institucional (`brand-600`) y verde esmeralda clínico (`accent-600`).
- **Navegación Inteligente y Enlaces:** Se añadieron accesos directos (*Campañas Activas*, *Obras Concretadas*, *Noticias*). El Navbar transparente ahora cuenta con detección automática de lectura (*Scroll-Spy*) para resaltar dinámicamente la sección activa, combinado con `Lenis` para un desplazamiento inercial premium.
- **Fondo de Cuadrícula Avanzada:** Implementación de un patrón de fondo global mediante `linear-gradient` simulando una cuadrícula médica (estilo ECG o Blueprint), aportando innovación visual y textura.
- **Dashboard y Estadísticas:** Solución de solapamientos (header spacing), transformación de contadores del Home a *cards* blancas con sombras sutiles, y gráficos optimizados (con color rojo institucional y etiquetas dinámicas) en el Panel Administrativo para lectura inmediata.
- **Footer Institucional Limpio:** Eliminación de *badges* y etiquetas de desarrollo en el pie de página para consolidar un aspecto 100% profesional y limpio de cara al usuario final.

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
   npm install
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
   npm run dev
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
   npm install
   ```
3. Iniciar el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *Vite levantará la aplicación frontend en `http://localhost:3000` con proxy reverso automático hacia el puerto 5001 para evitar bloqueos por CORS.*

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

### Versión 1.0.2 — Rediseño Estético Clínico y Scroll-Spy (Santiago Ialungo)
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


