import https from 'https';

const API_BASE = 'https://cooperadora-backend.onrender.com';
const ORIGIN = 'https://cooperadora-hospital.vercel.app';

function request(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'Origin': ORIGIN,
        'Content-Type': 'application/json; charset=utf-8',
        ...(options.headers || {})
      }
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = body;
        try {
          parsed = JSON.parse(body);
        } catch (e) {}

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  console.log('🚀 Iniciando sincronización de contenidos con el backend de producción...');

  // 1. Iniciar sesión como Admin
  console.log('🔑 Autenticando en producción...');
  const loginRes = await request(`${API_BASE}/api/auth/login`, { method: 'POST' }, {
    email: 'admin@cooperadora.org',
    password: 'AdminCoop2026!'
  });

  if (loginRes.statusCode !== 200) {
    throw new Error(`Fallo de login (${loginRes.statusCode}): ${JSON.stringify(loginRes.data)}`);
  }

  const rawCookie = loginRes.headers['set-cookie'];
  const cookieHeader = rawCookie ? rawCookie.map(c => c.split(';')[0]).join('; ') : '';
  const authHeaders = {
    'Cookie': cookieHeader,
    'Origin': ORIGIN
  };
  console.log('✅ Sesión administrativa iniciada.');

  // 2. Obtener campañas actuales de producción
  const currentCampanasRes = await request(`${API_BASE}/api/campanas?all=true`, { headers: authHeaders });
  const existingCampanas = Array.isArray(currentCampanasRes.data) ? currentCampanasRes.data : [];
  const existingCampTitles = new Set(existingCampanas.map(c => c.titulo.trim().toLowerCase()));

  // Lista de las 6 nuevas campañas
  const campaignsToSync = [
    {
      titulo: 'Modernización del Área de Neonatología y Cunas de Cuidados Especiales',
      monto_objetivo: 18500000.00,
      monto_actual: 6200000.00,
      fecha_limite: '2026-11-25T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'En Ejecución',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Incorporación de 2 incubadoras neonatales de alta complejidad con servocontrol térmico y 4 monitores multiparamétricos.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Actualización Tecnológica de Tomografía y Diagnóstico por Imágenes',
      monto_objetivo: 28000000.00,
      monto_actual: 9850000.00,
      fecha_limite: '2026-12-15T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'En Proceso de Licitación',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Tubo emisor multidetector de alta resolución y software de reconstrucción volumétrica 3D para estudios de urgencia.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Acondicionamiento y Humanización de la Sala de Maternidad',
      monto_objetivo: 9200000.00,
      monto_actual: 4100000.00,
      fecha_limite: '2026-10-31T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'Planeada',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Camas ergonómicas de Trabajo de Parto, Parto y Recuperación (TPR), monitores fetales doppler y climatización.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Torre de Laparoscopía 4K para Cirugías Mínimamente Invasivas',
      monto_objetivo: 22000000.00,
      monto_actual: 14500000.00,
      fecha_limite: '2026-11-15T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'En Ejecución',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Torre quirúrgica de video laparoscópico con óptica 4K Ultra HD, fuente de luz fría LED e insuflador automatizado.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Unidad Sanitaria Móvil para Atención y Vacunación en Barrios',
      monto_objetivo: 12400000.00,
      monto_actual: 5300000.00,
      fecha_limite: '2026-12-20T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'En Ejecución',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1632053002928-196160163354?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Furgón utilitario adaptado con camilla de examen, heladera de conservación térmica para vacunas y desfibrilador DEA.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Gimnasio de Rehabilitación Kinesiológica y Fisioterapia',
      monto_objetivo: 7800000.00,
      monto_actual: 2650000.00,
      fecha_limite: '2026-10-20T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'Planeada',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Barras paralelas de reeducación de la marcha, equipo digital de magnetoterapia, ultrasonido y camillas de tracción.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
    },
    // ── OBRAS CONCRETADAS (6 Campañas Finalizadas con 100% de recaudación y fechas distintas) ──
    {
      titulo: 'Adquisición de Nuevo Mamógrafo Digital Directo de Alta Resolución',
      monto_objetivo: 16000000.00,
      monto_actual: 16350000.00,
      fecha_limite: '2025-04-18T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'Finalizada',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Mamógrafo digital directo con estereotaxia para biopsias mamarias no invasivas y detección oncológica precoz.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Renovación Integral de Cunas y Salas de Lactario del Pabellón de Maternidad',
      monto_objetivo: 11500000.00,
      monto_actual: 11500000.00,
      fecha_limite: '2025-08-22T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'Finalizada',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Cunas térmicas, sillones de lactancia ergonómicos, refrigeradores biológicos para leche materna y pintura bactericida.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Reacondicionamiento Integral de la Guardia Médica y Central de Shock Room',
      monto_objetivo: 14200000.00,
      monto_actual: 14800000.00,
      fecha_limite: '2025-11-30T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'Finalizada',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Dos camillas articuladas de trauma shock room, lámparas scialíticas móviles y paneles de oxígeno central.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Incorporación de Respiradores y Monitores para la Unidad de Terapia Intensiva',
      monto_objetivo: 24000000.00,
      monto_actual: 24500000.00,
      fecha_limite: '2026-01-20T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'Finalizada',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Tres respiradores microprocesados de cuidados intensivos para adultos y bombas de infusión volumétricas.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Automatización del Laboratorio Central con Analizador Hematológico Digital',
      monto_objetivo: 8900000.00,
      monto_actual: 9150000.00,
      fecha_limite: '2026-03-14T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'Finalizada',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Autoanalizador hematológico de 5 diferenciales con capacidad de 60 muestras/hora y conexión digital con historia clínica.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80'
    },
    {
      titulo: 'Plaza Blanda y Espacio Lúdico en la Sala de Espera de Pediatría',
      monto_objetivo: 3800000.00,
      monto_actual: 3950000.00,
      fecha_limite: '2026-05-10T00:00:00.000Z',
      activo: true,
      es_campana_del_mes: false,
      obra_status: 'Finalizada',
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
        ]
      },
      testimonios: [],
      equipamiento_info: 'Mobiliario infantil de seguridad con bordes curvos, piso antigolpes, biblioteca interactiva y paneles sensoriales.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80'
    }
  ];

  console.log('🏥 Creando/Sincronizando Campañas en Producción...');
  for (const c of campaignsToSync) {
    if (existingCampTitles.has(c.titulo.trim().toLowerCase())) {
      console.log(`⏩ Campaña ya existente: "${c.titulo}"`);
      continue;
    }
    const createRes = await request(`${API_BASE}/api/campanas`, { method: 'POST', headers: authHeaders }, c);
    if (createRes.statusCode === 201) {
      console.log(`✅ Campaña creada: "${c.titulo}" (ID: ${createRes.data.campana?.id})`);
    } else {
      console.error(`❌ Error al crear campaña "${c.titulo}":`, createRes.statusCode, createRes.data);
    }
  }

  // 3. Sincronizar Noticias
  console.log('📰 Sincronizando Noticias en Producción...');
  const currentNewsRes = await request(`${API_BASE}/api/noticias`, { headers: authHeaders });
  const existingNews = Array.isArray(currentNewsRes.data) ? currentNewsRes.data : [];
  const existingNewsTitles = new Set(existingNews.map(n => n.titulo.trim().toLowerCase()));

  // Limpiar noticia de prueba residual "sda" si existe
  const sdaNews = existingNews.find(n => n.titulo === 'sda');
  if (sdaNews) {
    console.log('🧹 Eliminando noticia residual de prueba "sda"...');
    await request(`${API_BASE}/api/noticias/${sdaNews._id}`, { method: 'DELETE', headers: authHeaders });
  }

  // Actualizar imágenes a las 4 noticias existentes si están vacías
  const existingImageMap = {
    'lanzamiento de nuestra nueva plataforma web': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    'reconocimiento a nuestros socios vitalicios': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
    'adquisición de nuevo cardiodesfibrilador para guardia médica': 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80',
    'gran donación anual de la asociación de comerciantes': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80'
  };

  for (const n of existingNews) {
    const key = n.titulo.trim().toLowerCase();
    if (existingImageMap[key] && !n.imagen_url) {
      console.log(`🖼️ Asignando imagen a noticia existente: "${n.titulo}"`);
      await request(`${API_BASE}/api/noticias/${n._id}`, { method: 'PUT', headers: authHeaders }, {
        titulo: n.titulo,
        cuerpo_html: n.cuerpo_html,
        tags: n.tags,
        imagen_url: existingImageMap[key]
      });
    }
  }

  // 8 Nuevas Noticias
  const newsToSync = [
    {
      titulo: 'Llegaron los nuevos ecógrafos Doppler color adquiridos gracias al aporte societario',
      cuerpo_html: '<p>La Comisión Directiva de la Cooperadora del Hospital Municipal Dr. Emilio Ferreyra se complace en informar el arribo y entrega de <strong>dos flamantes equipos de ecografía Doppler color de última generación</strong>.</p><p>Estas unidades portátiles de alta precisión estarán destinadas prioritariamente al servicio de guardia general y a los consultorios de obstetricia y ginecología, permitiendo diagnósticos inmediatos ante emergencias cardiovasculares y monitoreo fetal de alta fidelidad sin demoras operativas.</p><p>Agradecemos sinceramente a cada socio que abona su cuota social mes a mes: este logro tecnológico es fruto directo de su solidaridad incondicional con la salud pública de Necochea y Quequén.</p>',
      tags: ['Equipamiento', 'Diagnóstico', 'Socios'],
      imagen_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      fecha: '2026-06-15T00:00:00.000Z'
    },
    {
      titulo: 'Exitosa Jornada Solidaria «Abrazo al Ferreyra»: Récord de participación comunitaria',
      cuerpo_html: '<p>Con un marco multitudinario de familias, vecinos y referentes de instituciones intermedias, se llevó adelante en el Parque Miguel Lillo la jornada solidaria <strong>«Abrazo al Ferreyra»</strong>.</p><p>El evento contó con la participación de artistas locales, espectáculos infantiles y puestos gastronómicos solidarios coordinados por los comerciantes de la ciudad. Gracias a las donaciones voluntarias y a la venta de bonos contribución, se logró recaudar fondos clave que aceleran la meta de modernización del pabellón pediátrico.</p><p>¡Gracias Necochea por demostrar una vez más que la unión comunitaria salva vidas!</p>',
      tags: ['Comunidad', 'Solidaridad', 'Eventos'],
      imagen_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      fecha: '2026-06-22T00:00:00.000Z'
    },
    {
      titulo: 'Concluyó la renovación integral del sistema de aire filtrado en la Unidad de Terapia Intensiva',
      cuerpo_html: '<p>En el marco del plan de mejoras edilicias y sanitarias, finalizaron exitosamente las obras de reacondicionamiento del sistema de presurización y filtrado de aire en la <strong>Unidad de Terapia Intensiva (UTI)</strong> del hospital.</p><p>La obra contempló la colocación de filtros HEPA de eficiencia absoluta y ductos antibacterianos que aseguran la máxima pureza ambiental, reduciendo al mínimo el riesgo de infecciones intrahospitalarias en pacientes críticos. Esta intervención fue supervisada por el área de bioingeniería y homologada según la normativa vigente del Ministerio de Salud.</p>',
      tags: ['Obras', 'Infraestructura', 'Salud'],
      imagen_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
      fecha: '2026-06-28T00:00:00.000Z'
    },
    {
      titulo: 'Capacitación continua en reanimación cardiopulmonar avanzada para enfermería pediátrica',
      cuerpo_html: '<p>Más de treinta enfermeros y técnicos de planta permanente completaron el curso intensivo de <strong>Reanimación Cardiopulmonar Pediátrica y Neonatal Avanzada</strong>, dictado en las instalaciones del nosocomio.</p><p>La capacitación, coordinada por instructores certificados de la Sociedad Argentina de Pediatría, fue solventada en su totalidad por la Cooperadora en concepto de formación continua y actualización profesional del personal de salud que cuida diariamente a nuestros niños.</p>',
      tags: ['Capacitación', 'Enfermería', 'Pediatría'],
      imagen_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      fecha: '2026-07-02T00:00:00.000Z'
    },
    {
      titulo: 'Firma de convenio académico y de cooperación asistencial con la Universidad Nacional',
      cuerpo_html: '<p>Se formalizó un trascendental acuerdo de articulación entre las autoridades hospitalarias, la Cooperadora y la <strong>Universidad Nacional</strong> para promover la llegada de médicos residentes y prácticas profesionales supervisadas.</p><p>Como parte del convenio, la Cooperadora acondicionará una nueva sala de ateneos clínicos y telemedicina provista de pantallas interactivas y material bibliográfico digital, estimulando la excelencia médica y el arraigo de nuevos especialistas en nuestro distrito.</p>',
      tags: ['Institucional', 'Educación', 'Medicina'],
      imagen_url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
      fecha: '2026-07-06T00:00:00.000Z'
    },
    {
      titulo: 'Colecta histórica del Banco de Sangre con más de 120 donantes voluntarios registrados',
      cuerpo_html: '<p>Con una concurrencia ejemplar de vecinos solidarios, concluyó la jornada extraordinaria organizada por el <strong>Servicio de Hemoterapia</strong> del Hospital Ferreyra junto al voluntariado de la Cooperadora.</p><p>Se registraron más de 120 donantes voluntarios de sangre y potenciales donantes de médula ósea, garantizando el abastecimiento de hemocomponentes para cirugías programadas y urgencias traumatológicas del próximo trimestre. Agradecemos a todas las personas que se acercaron a regalar vida.</p>',
      tags: ['Comunidad', 'Donaciones', 'Hemoterapia'],
      imagen_url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80',
      fecha: '2026-07-11T00:00:00.000Z'
    },
    {
      titulo: 'Inauguración de la nueva sala de espera amigable en consultorios externos pediátricos',
      cuerpo_html: '<p>Quedó oficialmente inaugurado el nuevo sector recreativo en la sala de espera de <strong>Consultorios Externos de Pediatría</strong>.</p><p>El espacio cuenta con mobiliario infantil de bordes redondeados, piso atérmico antigolpes, paneles sensoriales didácticos y un rincón de lectura infantil donado por autores necochenses. El objetivo central es humanizar la espera médica, disminuyendo los niveles de ansiedad y estrés en los más pequeños y sus familias.</p>',
      tags: ['Pediatría', 'Humanización', 'Comunidad'],
      imagen_url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      fecha: '2026-07-16T00:00:00.000Z'
    },
    {
      titulo: 'Presentación de memoria y balance 2025/2026: Compromiso con la transparencia',
      cuerpo_html: '<p>En cumplimiento con las normas estatutarias y reafirmando el valor ético de la transparencia, la Cooperadora presentó ante la asamblea ordinaria la <strong>Memoria y Balance General del ejercicio 2025/2026</strong>.</p><p>El dictamen contable profesional certificó que el 94,2% de los fondos ingresados a través de cuotas societarias, donaciones directas y eventos benéficos fue ejecutado en compras de aparatología médica, insumos descartables y mantenimiento de infraestructura crítica del nosocomio. El informe detallado ya se encuentra disponible para consulta de todos los socios activos.</p>',
      tags: ['Transparencia', 'Gestión', 'Asamblea'],
      imagen_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      fecha: '2026-07-20T00:00:00.000Z'
    }
  ];

  for (const n of newsToSync) {
    if (existingNewsTitles.has(n.titulo.trim().toLowerCase())) {
      console.log(`⏩ Noticia ya existente: "${n.titulo}"`);
      continue;
    }
    const createRes = await request(`${API_BASE}/api/noticias`, { method: 'POST', headers: authHeaders }, n);
    if (createRes.statusCode === 201) {
      console.log(`✅ Noticia creada: "${n.titulo}" (ID: ${createRes.data._id})`);
    } else {
      console.error(`❌ Error al crear noticia "${n.titulo}":`, createRes.statusCode, createRes.data);
    }
  }

  console.log('✨ Sincronización completada exitosamente.');
}

main().catch(err => {
  console.error('💥 Error fatal en sincronización:', err);
  process.exit(1);
});
