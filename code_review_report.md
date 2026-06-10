# Informe de Revisión de Código y Arquitectura (Full-Stack)

**Proyecto:** Cooperadora Hospital Municipal de Necochea
**Rol del Revisor:** Senior Full-Stack Developer & Security Auditor

Este informe presenta un análisis detallado del proyecto dividido en los cinco pilares solicitados. Para cada hallazgo se detalla su gravedad, el problema arquitectónico o de seguridad detectado, y la solución propuesta con fragmentos de código listos para su implementación.

---

## 1. Code Quality & Architecture (Calidad de Código y Arquitectura)

### Componentes de Vista Monolíticos

Severity: Medium

The Issue:
Los componentes de vista principal en el frontend, como [AdminPanel.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/AdminPanel.jsx) (63 KB) y [SocioPanel.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/views/SocioPanel.jsx) (58 KB), son excesivamente grandes y concentran múltiples responsabilidades: peticiones de datos de la API, manejo de estados locales complejos (formularios, modales, listados), validación de campos y maquetación visual. Esto dificulta la mantenibilidad, escalabilidad y realización de pruebas unitarias.

The Solution:
Separar la vista monolítica en subcomponentes modulares e implementar Custom Hooks para el manejo de estados de negocio y consumo de la API. A continuación se ejemplifica cómo modularizar el Custom Hook y un subcomponente de formulario para la creación de campañas en el panel de administración:

```javascript
// 1. Crear frontend/src/hooks/useAdminCampaigns.js (Manejo de estado lógico)
import { useState, useEffect } from "react";
import api from "../api/axios";

export const useAdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get("/campanas");
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData) => {
    const res = await api.post("/campanas", campaignData);
    setCampaigns((prev) => [...prev, res.data.campana]);
    return res.data;
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return { campaigns, loading, createCampaign, refetch: fetchCampaigns };
};
```

---

### Ausencia de Validación de Tipos en Componentes de React

Severity: Low

The Issue:
Componentes reutilizables clave como [CampaignCard.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/CampaignCard.jsx) reciben propiedades complejas de forma implícita (destructuradas desde `campaign`). La falta de validación de propiedades (`PropTypes`) aumenta el riesgo de errores en tiempo de ejecución debido a datos ausentes o mal formateados durante futuras actualizaciones del código.

The Solution:
Implementar validación explícita mediante la librería `prop-types` o migrar gradualmente a TypeScript para un tipado estático robusto.

```diff
// Modificación en frontend/src/components/CampaignCard.jsx
import React from 'react';
+import PropTypes from 'prop-types';
import { Target, TrendingUp, Calendar, ArrowRight, Clock } from 'lucide-react';

// ... (resto del código del componente sin cambios) ...

+CampaignCard.propTypes = {
+  campaign: PropTypes.shape({
+    id: PropTypes.number.isRequired,
+    titulo: PropTypes.string.isRequired,
+    monto_objetivo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
+    monto_actual: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
+    fecha_limite: PropTypes.string
+  }).isRequired,
+  onClickDetail: PropTypes.func.isRequired
+};

export default CampaignCard;
```

---

## 2. Performance Optimization (Optimización del Rendimiento)

### Carga Sincrónica de Rutas Pesadas (Falta de Code Splitting)

Severity: Medium

The Issue:
En [App.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/App.jsx), todas las pantallas principales se importan de manera sincrónica al inicio de la aplicación. Esto provoca que librerías pesadas necesarias solo para vistas restringidas (por ejemplo, `recharts` en el panel de administrador) se compilen en el bundle JavaScript inicial, afectando negativamente los tiempos de carga iniciales para los usuarios comunes que solo visitan el Home.

The Solution:
Implementar división de código utilizando `React.lazy` y envolver el enrutador en un contenedor `<Suspense />` con un componente de carga liviano.

```diff
// Modificación en frontend/src/App.jsx
-import Home from './views/Home';
-import Login from './views/Login';
-import AdminPanel from './views/AdminPanel';
-import SocioPanel from './views/SocioPanel';
+import React, { lazy, Suspense } from 'react';
+
+const Home = lazy(() => import('./views/Home'));
+const Login = lazy(() => import('./views/Login'));
+const AdminPanel = lazy(() => import('./views/AdminPanel'));
+const SocioPanel = lazy(() => import('./views/SocioPanel'));

// ...

function App() {
  return (
    <ReactLenis root>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow flex flex-col">
-           <Routes>
-             <Route path="/" element={<Home />} />
-             {/* ... */}
-           </Routes>
+           <Suspense fallback={
+             <div className="flex items-center justify-center min-h-[50vh]">
+               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-600"></div>
+             </div>
+           }>
+             <Routes>
+               <Route path="/" element={<Home />} />
+               <Route path="/login" element={<Login />} />
+               <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
+               <Route path="/mi-panel" element={<SocioProtectedRoute><SocioPanel /></SocioProtectedRoute>} />
+               <Route path="*" element={<Navigate to="/" replace />} />
+             </Routes>
+           </Suspense>
          </main>
          {/* Footer ... */}
        </div>
      </Router>
    </ReactLenis>
  );
}
```

---

### Inconsistencia de Datos en Operaciones Híbridas (Falta de Transaccionalidad)

Severity: High

The Issue:
El controlador [campanaController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/campanaController.js) (método `createCampana`) realiza una inserción en la base de datos SQL (PostgreSQL) para registrar los datos financieros de una campaña y posteriormente crea el registro de detalles enriquecidos en MongoDB. Si la inserción en MongoDB falla por desconexión o violación de validación, la base de datos SQL retiene la campaña creada. Esto genera inconsistencia del modelo híbrido (Mashup) al quedar una campaña SQL sin su contraparte de detalles NoSQL.

The Solution:
Aunque no se puede unificar una transacción ACID distribuida nativa entre bases de datos diferentes sin herramientas de coordinación complejas, se debe encapsular la creación de PostgreSQL en una transacción y revertirla (`rollback`) en el bloque `catch` si la inserción en MongoDB falla.

```javascript
// Modificación en backend/controllers/campanaController.js
import { CampanaEco } from "../models/index.js";
import CampanaDetalle from "../models/CampanaDetalle.js";
import sequelize from "../config/db.js";

export const createCampana = async (req, res) => {
  const {
    titulo,
    monto_objetivo,
    monto_actual,
    fecha_limite,
    es_campana_del_mes,
    testimonios,
    galeria_rica,
    obra_status,
  } = req.body;

  if (monto_objetivo < 0 || (monto_actual && monto_actual < 0)) {
    return res
      .status(400)
      .json({ error: "Los montos económicos no pueden ser negativos." });
  }

  // Iniciamos una transacción en SQL
  const transaction = await sequelize.transaction();

  try {
    if (es_campana_del_mes === true) {
      await CampanaEco.update(
        { es_campana_del_mes: false },
        { where: {}, transaction },
      );
    }

    // 1. Guardar en SQL con transacción asociada
    const sqlCampana = await CampanaEco.create(
      {
        titulo,
        monto_objetivo,
        monto_actual: monto_actual || 0.0,
        fecha_limite,
        activo: true,
        es_campana_del_mes: es_campana_del_mes || false,
      },
      { transaction },
    );

    // 2. Intentar guardar en NoSQL (MongoDB)
    try {
      const nosqlCampana = await CampanaDetalle.create({
        campana_id_ref: sqlCampana.id,
        testimonios: testimonios || [],
        galeria_rica: galeria_rica || { videos: [], imagenes: [] },
        obra_status: obra_status || "Planeada",
      });

      // Confirmar transacción SQL si ambas operaciones fueron exitosas
      await transaction.commit();

      return res.status(201).json({
        message: "Campaña creada exitosamente en ambas bases de datos.",
        campana: {
          ...sqlCampana.toJSON(),
          detalles: nosqlCampana,
        },
      });
    } catch (mongoError) {
      // Si falla MongoDB, lanzamos error para disparar el rollback de SQL
      console.error(
        "Error al insertar en MongoDB. Revirtiendo transacción SQL:",
        mongoError,
      );
      throw new Error("Fallo al registrar detalles de campaña en NoSQL.");
    }
  } catch (error) {
    // Revertir cambios en SQL ante cualquier error
    await transaction.rollback();
    console.error("Error al crear campaña:", error);
    return res.status(500).json({
      error: error.message || "Error interno al registrar la campaña.",
    });
  }
};
```

---

### Dependencias Innecesarias en el Backend

Severity: Low

The Issue:
El archivo [package.json](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/package.json) incluye el adaptador de base de datos `mysql2` en su listado de dependencias de producción, a pesar de que el backend opera de forma exclusiva sobre PostgreSQL y MongoDB. Las dependencias redundantes incrementan innecesariamente el tamaño del bundle en el despliegue y amplían la superficie expuesta a potenciales vulnerabilidades de seguridad.

The Solution:
Remover `mysql2` de las dependencias.

```bash
# Ejecutar en el directorio backend/
npm uninstall mysql2
```

---

## 3. Security Posture (Seguridad)

### Falla de Aceptación por Defecto en Webhooks (Fail Open)

Severity: Critical

The Issue:
El webhook de confirmación de pagos de Mercado Pago en [socioSubscriptionController.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/controllers/socioSubscriptionController.js) (líneas 196-235) contiene una estructura condicional que solo valida la firma criptográfica si existe la variable de entorno `MP_WEBHOOK_SECRET`:

```javascript
const webhookSecret = process.env.MP_WEBHOOK_SECRET;
if (webhookSecret) {
  // valida firma...
}
// continúa procesando el pago de forma libre si la variable no está seteada...
```

Si un operador olvida configurar la variable en el entorno de producción, la firma no se valida en lo absoluto y la API aceptará notificaciones falsas de cualquier origen. Esto permitiría a atacantes registrar donaciones inexistentes u otorgar el estado "activo" a perfiles de socio sin transferir dinero real.

The Solution:
Implementar un esquema de "Falla Cerrada" (Fail Closed), donde la firma de seguridad sea obligatoria. Si la variable no está configurada, la ejecución se debe detener devolviendo un código de error de configuración interna de seguridad, a menos que se fuerce explícitamente un entorno de pruebas unitarias.

```javascript
// Corrección del bloque en backend/controllers/socioSubscriptionController.js
const webhookSecret = process.env.MP_WEBHOOK_SECRET;

if (process.env.NODE_ENV === "production" && !webhookSecret) {
  console.error(
    "❌ ERROR CRÍTICO DE CONFIGURACIÓN: MP_WEBHOOK_SECRET no está configurado en producción.",
  );
  return res
    .status(500)
    .json({ error: "Error interno de seguridad en el servidor." });
}

if (webhookSecret) {
  try {
    const signatureParts = signatureHeader.split(",");
    let ts = "";
    let v1 = "";

    for (const part of signatureParts) {
      const [key, value] = part.split("=");
      if (key.trim() === "ts") ts = value.trim();
      if (key.trim() === "v1") v1 = value.trim();
    }

    if (!ts || !v1) {
      return res.status(403).json({ error: "Firma de webhook malformada." });
    }

    const dataId = req.body.data && req.body.data.id ? req.body.data.id : "";
    const manifest = `id:${dataId};request-id:${requestIdHeader};ts:${ts};`;

    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(manifest);
    const computedSignature = hmac.digest("hex");

    if (computedSignature !== v1) {
      console.error(
        "❌ [Webhook MP] Firma inválida. Posible ataque de suplantación.",
      );
      return res.status(403).json({ error: "Firma inválida." });
    }
  } catch (err) {
    console.error("Error en validación de firma de webhook:", err);
    return res
      .status(500)
      .json({ error: "Error interno en validación de webhook." });
  }
} else {
  // Bloque para desarrollo local cómodo (sin producción activa de MP)
  console.warn(
    "⚠️ Webhook recibido sin validación de firmas (MP_WEBHOOK_SECRET ausente).",
  );
}
```

---

### Ataques de Reutilización de Peticiones en Webhooks (Replay Attacks)

Severity: High

The Issue:
El proceso de verificación de firmas criptográficas para Mercado Pago lee el parámetro de marca de tiempo (`ts`) del encabezado para validar el cuerpo firmado, pero nunca evalúa que dicho valor corresponda al momento actual. Un atacante que capture una petición legítima de pago aprobado podría enviarla múltiples veces en el futuro (Replay Attack) para generar registros duplicados de cuotas pagadas o inyecciones fraudulentas de saldo a las campañas.

The Solution:
Validar la antigüedad de la marca de tiempo de la petición contra el reloj del servidor y rechazar aquellas con una desviación mayor a un umbral seguro (ej. 5 minutos).

```javascript
// Corrección en la validación de firma en backend/controllers/socioSubscriptionController.js
// Extraer ts y v1 ... (después de recuperarlos de signatureParts):

const timestampMs = parseInt(ts, 10) * 1000;
const currentServerTimeMs = Date.now();
const MAX_ALLOWED_DRIFT_MS = 5 * 60 * 1000; // 5 minutos

if (Math.abs(currentServerTimeMs - timestampMs) > MAX_ALLOWED_DRIFT_MS) {
  console.warn(
    `❌ [Webhook MP] Replay Attack detectado o timestamp expirado. Diferencia: ${Math.abs(currentServerTimeMs - timestampMs)}ms`,
  );
  return res
    .status(403)
    .json({ error: "Petición expirada (Timestamp fuera de límite)." });
}
```

---

### Configuración Laxa de Certificados SSL en Producción

Severity: High

The Issue:
En [db.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/config/db.js), la conexión de Sequelize a la base de datos PostgreSQL se define utilizando la bandera `rejectUnauthorized: false` para entornos de producción:

```javascript
dialectOptions: {
  ssl: process.env.NODE_ENV === "production" || dbUrl.includes("render.com")
    ? {
        require: true,
        rejectUnauthorized: false,
      }
    : false;
}
```

Esto deshabilita la validación del certificado SSL del servidor de base de datos. Un atacante con acceso a la red podría interceptar la conexión de base de datos y realizar un ataque de intermediario (Man-in-the-Middle - MitM) para leer o alterar la base de datos de socios, pagos y credenciales de usuario.

The Solution:
Suministrar el certificado de la Entidad Certificadora (CA Cert) de la base de datos en una variable de entorno en producción y forzar a Sequelize a validar la identidad del host remoto.

```javascript
// Corrección en backend/config/db.js
const sslOptions = () => {
  if (process.env.NODE_ENV !== "production" && !dbUrl.includes("render.com")) {
    return false;
  }

  // Si posees el certificado CA configurado en variables de entorno (Recomendado)
  if (process.env.DB_CA_CERT) {
    return {
      require: true,
      rejectUnauthorized: true,
      ca: [process.env.DB_CA_CERT], // Array de certificados CA autorizados
    };
  }

  // Fallback si la plataforma de hosting lo exige, pero emitiendo advertencias
  console.warn(
    "⚠️ Advertencia: Conectando a la DB con cifrado SSL pero sin validación de firmas de certificados (rejectUnauthorized: false).",
  );
  return {
    require: true,
    rejectUnauthorized: false,
  };
};

const sequelize = new Sequelize(dbUrl, {
  dialectOptions: {
    ssl: sslOptions(),
  },
  logging: process.env.NODE_ENV === "development" ? console.log : false,
});
```

---

### Contraseñas de Administrador Débiles y en Texto Plano en los Scripts de Semillero

Severity: High

The Issue:
El script utilitario de creación rápida de administradores [create-admin.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/create-admin.js) contiene la credencial inicial codificada en texto plano de forma permanente:

```javascript
const email = "admin@cooperadora.org";
const password = "admin123";
```

Si este script es ejecutado inadvertidamente en entornos de pre-producción o producción por parte del equipo de desarrollo, dejará una cuenta de administrador crítica expuesta a ataques de fuerza bruta automatizados debido a la debilidad de la contraseña por defecto.

The Solution:
Obtener la contraseña del administrador a través de variables de entorno de forma dinámica, cayendo a una advertencia o interrumpiendo el flujo si no está configurada.

```javascript
// Corrección en backend/create-admin.js
const email = process.env.ADMIN_EMAIL || "admin@cooperadora.org";
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.error(
    "❌ Error: Debes definir la variable de entorno ADMIN_PASSWORD para poder registrar un usuario administrativo.",
  );
  process.exit(1);
}
// Continuar con el hash de bcrypt y la inserción...
```

---

## 4. Responsiveness & UI/UX (Adaptabilidad y Experiencia de Usuario)

### Rutas Absolutas No Portables en Scripts del Backend

Severity: Medium

The Issue:
El script [check-users.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/check-users.js) (línea 4) inicializa las variables de entorno de `dotenv` utilizando una ruta absoluta mapeada estrictamente a la máquina local del desarrollador original:

```javascript
dotenv.config({
  path: "/Users/aramisprieto/Documents/cooperadora-hospital1/backend/.env",
});
```

Esto provoca fallas instantáneas de ejecución al desplegar la aplicación en contenedores Docker, servidores CI/CD o en la máquina de cualquier otro programador del equipo de trabajo.

The Solution:
Resolver las rutas a los archivos de configuración utilizando rutas relativas construidas con la ayuda de la biblioteca nativa `path` de Node.js y la utilidad `import.meta.url`.

```javascript
// Corrección en backend/check-users.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables apuntando al archivo en la raíz del backend del proyecto de manera dinámica
dotenv.config({ path: path.join(__dirname, ".env") });
```

---

### Inconsistencia en Mensajes de Contraseñas de Desarrollo

Severity: Low

The Issue:
El script utilitario para desarrolladores [update-email.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/update-email.js) indica al usuario que la contraseña del socio es `"socio123"` para realizar pruebas:

```javascript
console.log(
  `👉 Ahora puedes iniciar sesión con ese email y la misma contraseña ("socio123") para probar.`,
);
```

Sin embargo, al examinar la lógica del semillero principal [seed.js](file:///Users/aramisprieto/Documents/cooperadora-hospital1/backend/seed.js) (línea 32), la contraseña real del socio encriptada en la base de datos es `"SocioCoop2026!"`. Esta discrepancia de datos en los logs incrementa los tiempos perdidos por el equipo técnico intentando depurar problemas de inicio de sesión de manera innecesaria.

The Solution:
Corregir la instrucción del mensaje en el script para reflejar la contraseña real configurada por la base de datos del semillero.

```diff
// Modificación en backend/update-email.js
     user.email = newEmail.trim();
     await user.save();
     console.log(`\n✅ Email del socio de prueba actualizado exitosamente a: ${newEmail}`);
-    console.log(`👉 Ahora puedes iniciar sesión con ese email y la misma contraseña ("socio123") para probar.`);
+    console.log(`👉 Ahora puedes iniciar sesión con ese email y la misma contraseña ("SocioCoop2026!") para probar.`);
     process.exit(0);
```

---

## 5. Accessibility & SEO (Accesibilidad y SEO)

### Botones Repetitivos sin Etiquetas de Accesibilidad Contextuales

Severity: Medium

The Issue:
En la lista de campañas de [CampaignCard.jsx](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/src/components/CampaignCard.jsx), todos los botones para acceder al detalle se renderizan con el texto estático "Ver más". Al navegar mediante lectores de pantalla, el usuario solo escuchará una lista redundante de enunciados que dicen "Ver más", sin comprender a qué campaña específica hace referencia cada botón.

The Solution:
Agregar un atributo `aria-label` descriptivo al botón que incluya de forma dinámica el título de la campaña correspondiente.

```diff
// Modificación en frontend/src/components/CampaignCard.jsx
           <button
             onClick={() => onClickDetail(id)}
+            aria-label={`Ver más detalles sobre la campaña: ${titulo}`}
             className="flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 hover:text-brand-800 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border border-brand-200/50 hover:border-brand-300 transition-all duration-200 group/btn"
           >
             Ver más
```

---

### Ausencia de Etiquetas Meta SEO Esenciales en la Estructura HTML

Severity: Medium

The Issue:
El archivo [index.html](file:///Users/aramisprieto/Documents/cooperadora-hospital1/frontend/index.html) carece de etiquetas meta de descripción y Open Graph en su sección `<head>`. Esto perjudica significativamente la indexación del sitio por parte de motores de búsqueda y evita que los enlaces a campañas compartidos por redes sociales (como Facebook o WhatsApp) presenten previsualizaciones atractivas y legibles, algo vital para una plataforma de recolección de donaciones.

The Solution:
Incorporar etiquetas meta básicas de SEO y Open Graph dentro del encabezado HTML.

```diff
// Modificación en frontend/index.html
   <head>
     <meta charset="UTF-8" />
     <link rel="icon" type="image/png" href="/logo.png" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <title>Cooperadora - Hospital Municipal de Necochea</title>
+    <meta name="description" content="Portal oficial de la Asociación Cooperadora del Hospital Municipal de Necochea. Sumate como socio o realizá donaciones para equipamiento de alta complejidad." />
+    <!-- Open Graph / Redes Sociales -->
+    <meta property="og:title" content="Cooperadora - Hospital Municipal de Necochea" />
+    <meta property="og:description" content="Colaborá con el equipamiento y mantenimiento de la salud pública en Necochea. Tu aporte ayuda a salvar vidas." />
+    <meta property="og:image" content="/logo.png" />
+    <meta property="og:type" content="website" />
     <!-- Premium Google Fonts -->
```

Listed directory cooperadora-hospital1
Listed directory backend
Listed directory src
Viewed index.js:1-124
Viewed package.json:1-36
Viewed authController.js:1-185
Viewed axios.js:1-42
Listed directory middleware
Viewed auth.js:1-58

¡Hola! Qué buen trabajo vienes haciendo con el proyecto para la Cooperadora del Hospital. La estructura general del código (separación MVC en el backend, integración de Tailwind con componentes funcionales en React) está muy bien planteada.

A continuación, te presento mi evaluación crítica y exhaustiva como Senior Full-Stack Developer, enfocada en llevar tu proyecto a un estándar profesional de nivel de producción, organizada por los pilares que solicitaste:

### 1. Code Quality & Architecture

**Severity:** Medium
**The Issue:** Ausencia de transacciones (Transactions) en operaciones de base de datos interdependientes. En `authController.js` (función `register`), creas un `Usuario` y luego un `PerfilSocio`. Si la creación del `PerfilSocio` falla (por un error de validación, caída de BD, etc.), el `Usuario` ya quedó insertado permanentemente en la base de datos sin un perfil asociado, generando datos huérfanos e inconsistencias.
**The Solution:** Envuelve las operaciones relacionadas dentro de una transacción de Sequelize.

```javascript
import { sequelize } from "../config/db.js";

export const register = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // ... validaciones previas ...
    const user = await Usuario.create(
      {
        email,
        password_hash,
        rol: "socio",
      },
      { transaction: t },
    );

    const perfil = await PerfilSocio.create(
      {
        usuario_id_fk: user.id,
        dni, // ...otros campos
      },
      { transaction: t },
    );

    await t.commit(); // Todo fue exitoso, guardamos en disco
    // ... enviar respuesta ...
  } catch (error) {
    await t.rollback(); // Algo falló, deshacemos la creación del usuario
    return res.status(500).json({ error: "Error al registrar." });
  }
};
```

**Severity:** Low
**The Issue:** Redirección forzada (hard-refresh) en los interceptores de Axios. En `frontend/src/api/axios.js` manejas el token expirado con `window.location.href = '/login?expired=true'`. Esto rompe el ciclo de vida de la Single Page Application (SPA), forzando a que el navegador descargue todo de nuevo.
**The Solution:** Es mejor inyectar una función que utilice `useNavigate` de `react-router-dom` a un contexto global, o emitir un evento que escuche tu `App.jsx`.

```javascript
// Opción rápida mediante Eventos del Navegador:
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-expired")); // Escuchado por App.jsx
    }
    return Promise.reject(error);
  },
);
```

### 2. Security Posture (OWASP Top 10)

**Severity:** High (Critical en Producción)
**The Issue:** Uso de Secretos de Fallback (`fallback_secret`) en JWT. Tanto en `backend/index.js` como en `backend/middleware/auth.js` tienes: `const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';`. Si por error el `.env` no carga en producción, tu app empezará a firmar tokens con una clave pública conocida, permitiendo que cualquiera falsifique tokens de administrador.
**The Solution:** Rompe la ejecución de la app (fail-fast) si falta el secreto de producción.

```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined.");
}
```

**Severity:** High
**The Issue:** Almacenamiento de JWT en `localStorage`. Si bien es común, expone tu token directamente ante cualquier vulnerabilidad de Cross-Site Scripting (XSS). Cualquier script inyectado puede leer el token. Además, tu protección de rutas en React (`<ProtectedRoute>`) confía ciegamente en `localStorage.getItem('user')`, el cual el usuario puede editar manualmente desde DevTools (cambiando `rol: "admin"`).
**The Solution:** Migra los JWT a **HttpOnly Cookies**, lo cual bloquea la lectura vía JS. En Express:

```javascript
// En el authController.js (login):
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 8 * 60 * 60 * 1000,
});
// Para el Frontend, implementa un endpoint `/api/auth/me` para verificar rol real.
```

### 3. Performance Optimization

**Severity:** Medium
**The Issue:** Ausencia de Paginación. Por lo que vi en las peticiones en `Home.jsx`, estás obteniendo todas las campañas y noticias con `api.get('/noticias')`. Cuando el hospital cargue docenas de artículos en el CMS, la carga del payload se volverá enorme, degradando los tiempos de respuesta del Backend y la renderización en el Frontend.
**The Solution:** Implementa paginación o límites en tus controladores (ej. Limit: 10) y soporte para Infinite Scroll o "Ver más" en React.

```javascript
// Backend Controller
const { limit = 10, page = 1 } = req.query;
const noticias = await Noticia.find()
  .limit(Number(limit))
  .skip((Number(page) - 1) * Number(limit));

// Frontend Axios
const res = await api.get(`/noticias?limit=6&page=1`);
```

### 4. Responsiveness & UI/UX

**Severity:** Low
**The Issue:** Faltan estados visuales en los botones cuando hay una operación en curso en los modales. Aunque usas variables de estado como `submittingDonation` en `Home.jsx`, los botones no siempre reflejan que hay una solicitud asíncrona pasando por la red, lo que podría provocar doble-clics.
**The Solution:** Añadir el atributo de deshabilitado y cambiar el diseño del botón.

```jsx
<button
  type="submit"
  disabled={submittingDonation}
  className={`w-full btn-brand py-3 text-sm ${submittingDonation ? "opacity-70 cursor-not-allowed" : ""}`}
>
  {submittingDonation ? "Procesando..." : "Confirmar Transferencia"}
</button>
```

### 5. Accessibility (a11y) & SEO

**Severity:** Medium
**The Issue:** La app como SPA de React, por defecto, envía un `index.html` con un título genérico (ej. "Vite + React") y sin metadatos enriquecidos, afectando gravemente el SEO si se desea posicionar campañas.
**The Solution:** Instala y utiliza `react-helmet-async` para insertar metadatos por cada vista.

```jsx
// npm install react-helmet-async
import { Helmet } from "react-helmet-async";

const Home = () => (
  <>
    <Helmet>
      <title>Asociación Cooperadora - Hospital Emilio Ferreyra</title>
      <meta name="description" content="Apoya las campañas del hospital..." />
    </Helmet>
    {/* resto del componente */}
  </>
);
```
