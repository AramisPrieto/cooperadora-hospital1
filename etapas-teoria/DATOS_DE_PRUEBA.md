# 🧪 Resumen de Datos de Prueba (Seed Data)

Este documento detalla toda la información ficticia que se inyecta en el sistema al ejecutar el comando de prueba (el script `seed.js`). Sirve para que puedas iniciar sesión, hacer pruebas y ver el sistema funcionando a plena capacidad.

> [!NOTE]
> **Base de Datos SQL (PostgreSQL):** Almacena usuarios, perfiles, campañas (datos económicos), cuotas sociales y donaciones.
> **Base de Datos NoSQL (MongoDB):** Almacena detalles ricos de campañas (testimonios, galerías) y artículos de noticias.

---

## 👥 1. Usuarios y Perfiles (SQL)

Se han creado cuentas predeterminadas para poder probar distintos niveles de acceso.

> [!IMPORTANT]
> **Contraseñas por defecto:**
> - Contraseña del **Administrador**: `AdminCoop2026!`
> - Contraseña de todos los **Socios** (incluyendo el de MP): `SocioCoop2026!`

| Rol | Email | Estado | Método de Pago | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@cooperadora.org` | *N/A* | *N/A* | Acceso al panel de control total |
| **Socio Oficial (MP)** | `test_user_7385770550601504283@testuser.com` | **Activo** | Débito | Usuario de pruebas (Sandbox) de Mercado Pago |
| Socio | `juan.perez@email.com` | **Activo** | Efectivo | |
| Socio | `maria.gomez@email.com` | **Activo** | Transferencia | |
| Socio | `carlos.rodriguez@email.com` | Pendiente | Cobrador | |
| Socio | `ana.martinez@email.com` | Inactivo | Débito | |
| Socio | `pedro.gomez@email.com` | **Activo** | Transferencia | |
| Socio | `sofia.lopez@email.com` | Pendiente | Débito | |

---

## 🏥 2. Campañas de Recaudación

Las campañas combinan datos numéricos en SQL con detalles enriquecidos (textos largos e imágenes) en MongoDB.

1. **Equipamiento de Alta Complejidad para la Sala de Pediatría**
   - **Monto Objetivo:** $5,000,000
   - **Estado Obra:** En Proceso de Licitación
   - **Activa:** Sí
2. **Renovación de Techos y Fachada del Pabellón B**
   - **Monto Objetivo:** $8,500,000
   - **Estado Obra:** Planeada
   - **Activa:** Sí
3. **Nueva Ambulancia de Traslado Pediátrico**
   - **Monto Objetivo:** $15,000,000
   - **Estado Obra:** Recaudación
   - **Activa:** Sí
4. **Insumos Quirúrgicos y Material Descartable**
   - **Monto Objetivo:** $2,000,000
   - **Estado Obra:** Casi Completada
   - **Activa:** Sí
5. **Campaña de Invierno: Frazadas y Calefacción**
   - **Monto Objetivo:** $1,200,000
   - **Estado Obra:** Finalizada y Entregada
   - **Activa:** No (Campaña pasada)

---

## 📰 3. Noticias y Novedades (MongoDB)

Artículos de prueba para la sección de Novedades / Blog de la web:

1. **Gran Donación Anual de la Asociación de Comerciantes** (Tags: Donaciones, Pediatría)
2. **Adquisición de Nuevo Cardiodesfibrilador para Guardia Médica** (Tags: Equipamiento, Socios)
3. **Reconocimiento a nuestros Socios Vitalicios** (Tags: Socios, Comunidad)
4. **Lanzamiento de nuestra Nueva Plataforma Web** (Tags: Tecnología, Innovación)

---

## 💰 4. Transacciones Financieras (SQL)

Para probar paneles administrativos, se generan cuotas y donaciones automáticas:

### Cuotas Sociales
Se generan 5 cuotas históricas para el **Socio Oficial**:
- 3 cuotas con estado `pagado`.
- 2 cuotas recientes con estado `pendiente`.

### Donaciones por Transferencia Bancaria
Se simulan comprobantes enviados por los usuarios que el administrador debe aprobar:
- **Juan Pérez:** $15,000 (Estado: `pendiente`)
- **María Gómez:** $30,000 (Estado: `aprobada`)
