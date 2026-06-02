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

### Versión 1.1.0 — Checkout de Transferencias y Corrección de Scroll (Kevin Nielsen)
- **Donaciones por Transferencia Bancaria**: 
  - Creado el modelo relacional `DonacionTransferencia` en PostgreSQL para registrar transferencias pendientes, aprobadas y rechazadas.
  - Implementado el controlador y las rutas de la API en `/api/donaciones` para la declaración de transferencias bancarias de socios de forma segura.
- **Aprobación Administrativa Manual**:
  - Incorporada la pestaña **"Transferencias"** en el panel administrativo (`AdminPanel.jsx`) para que el operador de la ONG apruebe o rechace de forma manual y transaccional las donaciones declaradas, impactando de forma segura en la barra de progreso de la campaña.
- **Visualización Compacta del Modal**:
  - Simplificado el modal de detalles de campaña en el Home para eliminar los bloques multimedia de testimonios, galerías y estado del proyecto a fin de agilizar el proceso de donación.
- **Optimización de UX & Scroll (Lenis)**:
  - Migrado el wrapper de Lenis al paquete oficial `lenis/react`.
  - Removido `scroll-behavior: smooth` de `index.css` y modificados los manejadores del Hero para utilizar la API inercial nativa de Lenis, solucionando los problemas de tironeo en el scroll.
- **Seguridad en Contenedores**:
  - Parametrizadas las credenciales de PostgreSQL en `docker-compose.yml` utilizando variables de entorno (`DB_USER`, `DB_PASSWORD`) con fallbacks seguros de desarrollo local.

