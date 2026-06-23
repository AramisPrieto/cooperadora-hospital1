# 🧠 Guía de Estudio Completa: Proyecto Cooperadora Hospital Ferreyra

*Esta guía está diseñada con técnicas de **Recuerdo Activo** y **Chunking (Agrupación)**. Resume las 25 secciones del documento oficial agrupándolas en 6 grandes bloques temáticos fáciles de recordar para tu defensa oral.*

---

## Bloque 1: El Proyecto (Qué, Por qué y Para quién)
*(Cubre las secciones 1 a 6)*

**¿Qué hicimos y cuál es la meta?**
*   **Problema:** Administración en papel, lenta y sin transparencia.
*   **Solución:** Portal web transaccional híbrido.
*   **Misión:** Conectar a la comunidad con el hospital mediante donaciones transparentes.
*   **Visión:** Ser el canal digital líder, 100% digitalizado.
*   **Objetivos Clave:** Digitalizar el registro de socios, validar transferencias manualmente con barras de progreso en tiempo real y usar persistencia híbrida (SQL/NoSQL).

**¿Quiénes están involucrados (Stakeholders) y qué abarca?**
*   **Stakeholders:** Product Owner (Cooperadora/Profesor), Usuarios (Donantes), Operadores (Admin), Equipo Dev (Aramis, Kevin, Thiago, Santiago).
*   **Alcance Incluido:** Registro, Panel de socio, Checkout de Mercado Pago, Panel Admin, Noticias, Emails automatizados con Resend.
*   **Fuera de Alcance:** Cobros directos con Tarjeta de Crédito (se tercerizó a Mercado Pago) y App Móvil Nativa.

---

## Bloque 2: Metodología y Organización (Scrum y Estimaciones)
*(Cubre las secciones 7, 8 y 19)*

**¿Por qué Scrum + Incremental?**
Porque nos permitió entregar "pedazos que funcionaban" (incrementos) para las distintas entregas de la materia y nos dio agilidad para cambiar cosas en el camino.

**¿Cómo estimamos el esfuerzo? (Pregunta clave de examen)**
Combinamos dos cosas:
1.  **WBS (Work Breakdown Structure):** Rompimos el proyecto en 8 grandes tareas (Infraestructura, Autenticación, Socios, Campañas, Donaciones, etc.).
2.  **Story Points (Planning Poker):** En vez de estimar en horas (que es inexacto en estudiantes), le pusimos puntos de dificultad (1, 2, 3, 5, 8). En total fueron **77 SP originales** que terminaron escalando a **124 SP**.
    *   *Ejemplo de tarea pesada (8 SP):* Control de concurrencia en donaciones y Webhooks de Mercado Pago.

---

## Bloque 3: Requerimientos y Riesgos (Lo Técnico)
*(Cubre las secciones 9 a 14 y 17)*

**Requerimientos Fundamentales (RF y RNF):**
*   **RF (Funcionales):** Autenticación JWT, Mashup de campañas, Límite de metas (no donar si llegó al 100%).
*   **RNF (No Funcionales):** Encriptación `bcrypt`, evitar inyecciones, Rate Limiting (100 peticiones / 15 min).

**La Deuda Técnica (Los atajos que tomamos):**
1.  *Sincronización manual:* Como usamos Postgres y Mongo, al borrar algo, debemos programarlo a mano en ambas bases.
2.  *Validación humana:* Como no hay conexión con el banco, el administrador tiene que presionar "Aprobar" mirando su homebanking.

**Los Mayores Riesgos y sus Mitigaciones (Técnica Feynman):**
*   **Concurrencia (Dos donan al mismo tiempo):** Usamos `SELECT FOR UPDATE` en PostgreSQL. Es como darle el único bolígrafo a uno y hacer que el otro espere su turno en fila para que no se pisen los números de la plata.
*   **Ataques XSS (Código malicioso en Noticias):** Usamos **DOMPurify** (un filtro que limpia los textos antes de mostrarse en pantalla).
*   **Ataque IDOR (Cambiar el ID en la URL para ver datos ajenos):** Sacamos el ID de la URL y lo leemos de la sesión segura (Token JWT).
*   **Bloqueo de puerto SMTP en la nube:** Usamos la API de **Resend** (puerto seguro HTTPS 443) en vez del puerto tradicional de emails para evitar bloqueos del servidor.

---

## Bloque 4: Recursos y Costos del Proyecto
*(Cubre las secciones 20 y 21)*

Si el proyecto se cobrara en el mundo real, ¿cuánto saldría?
*   **Recursos Humanos:** 4 desarrolladores x 64 hs cada uno (256 horas totales). A $15 USD la hora = **$3.840 USD** en mano de obra.
*   **Costos Tecnológicos (Nube):** Usar Render, Vercel, MongoDB Atlas y dominio cuesta aprox **$183 USD/año**.
*   **Mantenimiento:** Por mantenimiento mensual y backups se cobrarían **$960 USD/año**.
*   **Total primer año:** **~$4.983 USD**.

---

## Bloque 5: Planificación y Gestión de Cambios (La Vida Real)
*(Cubre las secciones 22 a 24)*

**Hitos importantes (La línea de tiempo):**
Arrancamos en Abril (Análisis) y terminamos en Junio (Testing y Defensa). Hubo 10 hitos. El testing automatizado fue crítico antes de entregar.

**¿Qué cosas cambiamos en el camino y por qué? (Gestión de Cambios)**
Hubo 10 cambios fuertes, los 3 más preguntables son:
1.  **Sacar Tarjetas de Crédito directas:** Para evitar líos impositivos y comisiones, dejamos solo Mercado Pago y Transferencias.
2.  **Cookies SameSite en Vercel:** Como el frontend (Vercel) y el backend (Render) estaban en dominios separados, las cookies de sesión se bloqueaban. Lo arreglamos usando un "proxy inverso" (engañar al navegador para que crea que son el mismo dominio).
3.  **Vistas independientes:** La página de inicio era muy pesada, así que separamos las Campañas y las Noticias en pestañas distintas.

---

## Bloque 6: Calidad, Testing y Conclusión Final
*(Cubre las secciones 15, 16 y 25)*

**¿Cómo aseguramos que no se caiga ni ande mal?**
*   **Data Mashup (`Promise.all`):** Para juntar los datos de Postgres y Mongo rápido, los pedimos en paralelo (al mismo tiempo) en vez de uno por uno.
*   **Suite de Pruebas Automatizadas:** Hicimos **79 pruebas en Vitest** sobre bases de datos "de mentira" para probar que nada se rompa cada vez que programábamos algo nuevo.
*   **Accesibilidad y UX:** Usamos Lenis Scroll para que se deslice fluido, y pasamos pruebas de accesibilidad (WCAG) para las ventanas de compartir.

**Conclusión para tu Defensa:**
El proyecto arrancó con 77 SP y terminó en 124 SP. Sortear problemas de producción reales (como los bloqueos SMTP de Render o los retornos de Mercado Pago) nos hizo aplicar infraestructura en la nube real. Hoy la Cooperadora tiene un sistema 100% funcional, seguro, auditado y listo para usar.
