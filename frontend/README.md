# ⚛️ Frontend App — Cooperadora Hospital Dr. Emilio Ferreyra

Este directorio contiene la aplicación del cliente (Single Page Application) desarrollada con React, construida con Vite y estilada con Tailwind CSS.

---

## 📂 Estructura de Directorios

La organización del código fuente en la carpeta `/src` está estructurada de la siguiente manera:

```text
frontend/
├── public/             # Archivos públicos estáticos (imágenes, logos, etc.)
├── src/
│   ├── api/            # Configuración de clientes API
│   │   └── axios.js    # Instancia central de Axios configurada con interceptores (JWT)
│   ├── components/     # Componentes compartidos y reutilizables
│   │   ├── admin/      # Formularios y gráficos exclusivos del panel de administración
│   │   │   ├── CampaignForm.jsx     # Formulario de creación/edición de campañas
│   │   │   ├── DashboardCharts.jsx  # Gráficos del panel de control (Recharts)
│   │   │   ├── NewsForm.jsx         # Formulario de creación/edición de novedades
│   │   │   └── PartnerForm.jsx      # Formulario para ver/aprobar datos de socios
│   │   ├── auth/       # Middleware visual de autenticación
│   │   │   └── ProtectedRoute.jsx   # Control de acceso por rol y estado de login
│   │   ├── socio/      # Vistas interiores de la pestaña del asociado
│   │   │   ├── CuotasTab.jsx        # Gestión de pago de cuotas (Mercado Pago / manual)
│   │   │   ├── DonacionesTab.jsx    # Historial de donaciones hechas por el socio
│   │   │   └── SocioProfile.jsx     # Datos personales e impresión de credencial
│   │   ├── CampaignCard.jsx         # Tarjeta de campaña con barra de progreso
│   │   ├── FileUpload.jsx           # Componente de subida de imágenes y comprobantes
│   │   ├── Footer.jsx               # Pie de página institucional
│   │   ├── Navbar.jsx               # Menú de navegación principal con login/logout
│   │   ├── ScrollToTop.jsx          # Comportamiento de scroll automático al navegar
│   │   ├── ShareModal.jsx           # Modal de compartir rápido (redes y portapapeles)
│   │   └── Skeletons.jsx            # Pantallas de carga tipo esqueleto (Skeletons UI)
│   ├── views/          # Vistas principales de página completa (Rutas)
│   │   ├── AdminPanel.jsx      # Panel del Administrador (solicitudes, campañas, noticias)
│   │   ├── CampaignDetail.jsx  # Detalle de campaña (donar, Mercado Pago, obras)
│   │   ├── CampaignSearch.jsx  # Listado y buscador de campañas de recaudación
│   │   ├── Home.jsx            # Página principal institucional, estadísticas y noticias
│   │   ├── Login.jsx           # Formulario unificado de ingreso y registro (socios)
│   │   ├── NewsDetail.jsx      # Detalle extendido de una noticia
│   │   ├── NewsSearch.jsx      # Buscador e histórico de novedades
│   │   ├── ObrasConcretadas.jsx # Listado de campañas finalizadas e impacto social
│   │   └── SocioPanel.jsx      # Panel privado del socio (Cuotas, Donaciones, Perfil)
│   ├── App.jsx         # Declaración del Router y rutas públicas/privadas
│   ├── index.css       # Configuración global de estilos y directivas de Tailwind
│   └── main.jsx        # Punto de entrada de la aplicación React
├── postcss.config.js   # Configuración de PostCSS para Tailwind
├── tailwind.config.js  # Definición de la paleta de colores y temas de Tailwind
├── vercel.json         # Configuración del proxy inverso y redirecciones para Vercel
├── vite.config.js      # Configuración de empaquetado Vite
└── vitest.config.js    # Configuración del entorno de pruebas unitarias
```

---

## 🚦 Control de Navegación y Acceso

El acceso a las secciones internas se gestiona dinámicamente mediante el estado de autenticación (JWT) y el rol del usuario (`admin` o `socio`):
* **`ProtectedRoute`**: Bloquea rutas internas según el rol requerido.
* **`GuestRoute` (en `App.jsx`)**: Redirecciona a usuarios autenticados lejos de `/login` para evitar accesos repetidos accidentales.

---

## ♿ Pruebas y Accesibilidad (Vitest)

La aplicación incluye pruebas automatizadas con **Vitest** y **React Testing Library**:
* **WCAG Compliance:** Se validan los estándares de accesibilidad en los componentes más críticos (como `Navbar`, `Footer`, `ShareModal` y `Skeletons`) utilizando `jest-axe` para garantizar que la web sea utilizable por personas con discapacidades visuales o de navegación.
* **Pruebas de Componentes:** Cada componente central cuenta con su correspondiente archivo `.test.jsx` para comprobar estados de carga, renderizado y comportamientos interactivos.

---

## 🛠️ Comandos de Desarrollo (pnpm)

*Por favor, ejecuta estos comandos dentro de la carpeta `/frontend` o usando el filtro de pnpm en la raíz del proyecto:*

* **Iniciar en modo desarrollo:**
  ```bash
  pnpm run dev
  ```
  *(Abre el servidor local de Vite en `http://localhost:5173`).*

* **Compilar para producción:**
  ```bash
  pnpm run build
  ```
  *(Genera la carpeta optimizada `dist` lista para desplegar en Vercel).*

* **Ejecutar suite de pruebas:**
  ```bash
  pnpm run test
  ```

* **Ejecutar pruebas en modo observador (watch):**
  ```bash
  pnpm run test:watch
  ```
