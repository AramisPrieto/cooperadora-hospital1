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
6. **Modernización del Área de Neonatología y Cunas de Cuidados Especiales**
   - **Monto Objetivo:** $18,500,000
   - **Estado Obra:** En Ejecución
   - **Activa:** Sí
7. **Actualización Tecnológica de Tomografía y Diagnóstico por Imágenes**
   - **Monto Objetivo:** $28,000,000
   - **Estado Obra:** En Proceso de Licitación
   - **Activa:** Sí
8. **Acondicionamiento y Humanización de la Sala de Maternidad**
   - **Monto Objetivo:** $9,200,000
   - **Estado Obra:** Planeada
   - **Activa:** Sí
9. **Torre de Laparoscopía 4K para Cirugías Mínimamente Invasivas**
   - **Monto Objetivo:** $22,000,000
   - **Estado Obra:** En Ejecución
   - **Activa:** Sí
10. **Unidad Sanitaria Móvil para Atención y Vacunación en Barrios**
    - **Monto Objetivo:** $12,400,000
    - **Estado Obra:** En Ejecución
    - **Activa:** Sí
11. **Gimnasio de Rehabilitación Kinesiológica y Fisioterapia**
    - **Monto Objetivo:** $7,800,000
    - **Estado Obra:** Planeada
    - **Activa:** Sí

### Obras Concretadas (100% Recaudadas y Finalizadas)
12. **Adquisición de Nuevo Mamógrafo Digital Directo de Alta Resolución**
    - **Monto Objetivo:** $16,000,000 | **Monto Recaudado:** $16,350,000 (102%)
    - **Fecha de Concreción:** 18 de Abril de 2025
    - **Estado Obra:** Finalizada
13. **Renovación Integral de Cunas y Salas de Lactario del Pabellón de Maternidad**
    - **Monto Objetivo:** $11,500,000 | **Monto Recaudado:** $11,500,000 (100%)
    - **Fecha de Concreción:** 22 de Agosto de 2025
    - **Estado Obra:** Finalizada
14. **Reacondicionamiento Integral de la Guardia Médica y Central de Shock Room**
    - **Monto Objetivo:** $14,200,000 | **Monto Recaudado:** $14,800,000 (104%)
    - **Fecha de Concreción:** 30 de Noviembre de 2025
    - **Estado Obra:** Finalizada
15. **Incorporación de Respiradores y Monitores para la Unidad de Terapia Intensiva**
    - **Monto Objetivo:** $24,000,000 | **Monto Recaudado:** $24,500,000 (102%)
    - **Fecha de Concreción:** 20 de Enero de 2026
    - **Estado Obra:** Finalizada
16. **Automatización del Laboratorio Central con Analizador Hematológico Digital**
    - **Monto Objetivo:** $8,900,000 | **Monto Recaudado:** $9,150,000 (103%)
    - **Fecha de Concreción:** 14 de Marzo de 2026
    - **Estado Obra:** Finalizada
17. **Plaza Blanda y Espacio Lúdico en la Sala de Espera de Pediatría**
    - **Monto Objetivo:** $3,800,000 | **Monto Recaudado:** $3,950,000 (104%)
    - **Fecha de Concreción:** 10 de Mayo de 2026
    - **Estado Obra:** Finalizada

---

## 📰 3. Noticias y Novedades (MongoDB)

Artículos de prueba para la sección de Novedades / Blog de la web con imágenes y formato enriquecido:

1. **Gran Donación Anual de la Asociación de Comerciantes** (Tags: Donaciones, Solidaridad, Pediatría)
2. **Adquisición de Nuevo Cardiodesfibrilador para Guardia Médica** (Tags: Equipamiento, Guardia, Socios)
3. **Reconocimiento a nuestros Socios Vitalicios** (Tags: Socios, Comunidad)
4. **Lanzamiento de nuestra Nueva Plataforma Web** (Tags: Tecnología, Innovación, Noticias)
5. **Llegaron los nuevos ecógrafos Doppler color adquiridos gracias al aporte societario** (Tags: Equipamiento, Diagnóstico, Socios)
6. **Exitosa Jornada Solidaria «Abrazo al Ferreyra»: Récord de participación comunitaria** (Tags: Comunidad, Solidaridad, Eventos)
7. **Concluyó la renovación integral del sistema de aire filtrado en la Unidad de Terapia Intensiva** (Tags: Obras, Infraestructura, Salud)
8. **Capacitación continua en reanimación cardiopulmonar avanzada para enfermería pediátrica** (Tags: Capacitación, Enfermería, Pediatría)
9. **Firma de convenio académico y de cooperación asistencial con la Universidad Nacional** (Tags: Institucional, Educación, Medicina)
10. **Colecta histórica del Banco de Sangre con más de 120 donantes voluntarios registrados** (Tags: Comunidad, Donaciones, Hemoterapia)
11. **Inauguración de la nueva sala de espera amigable en consultorios externos pediátricos** (Tags: Pediatría, Humanización, Comunidad)
12. **Presentación de memoria y balance 2025/2026: Compromiso con la transparencia** (Tags: Transparencia, Gestión, Asamblea)

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
