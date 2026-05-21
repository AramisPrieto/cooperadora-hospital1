# 🏥 Cooperadora del Hospital Municipal "Dr. Emilio Ferreyra" (Necochea)
### Trabajo Final Integrador (TFI) — Programación IV (Etapa 4)
**Universidad Tecnológica Nacional (UTN) — Extensión Áulica Necochea**

---

## 👥 Integrantes del Grupo
* **Aramis Prieto**
* **Kevin Nielsen**
* **Thiago Masson**
* **Santi Ialungo**

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
   * `JWT_SECRET`: Llave secreta para firmar tokens.
5. Iniciar el servidor backend en modo desarrollo (nodemon):
   ```bash
   npm run dev
   ```
   *El servidor compilará y sincronizará automáticamente las tablas relacionales de SQL y escuchará en el puerto 5000 (`http://localhost:5000`).*

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
   *Vite levantará la aplicación frontend en `http://localhost:3000` con proxy reverso automático hacia el puerto 5000 para evitar bloqueos por CORS.*

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
