import bcrypt from 'bcryptjs';
import { connectSQL } from './config/db.js';
import { connectMongoDB } from './config/mongo.js';
import sequelize from './config/db.js';
import { CampanaEco, Usuario, PerfilSocio, PagoCuota, DonacionTransferencia } from './models/index.js';
import CampanaDetalle from './models/CampanaDetalle.js';
import NoticiaActualidad from './models/NoticiaActualidad.js';

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    await connectSQL();
    await connectMongoDB();

    // Sincronizar esquemas primero (recreando las tablas limpias)
    await sequelize.sync({ force: true });

    // Limpiar base de datos (las cascadas limpiarán las relaciones dependientes)
    await DonacionTransferencia.destroy({ where: {} });
    await PagoCuota.destroy({ where: {} });
    await PerfilSocio.destroy({ where: {} });
    await Usuario.destroy({ where: {} });
    await CampanaEco.destroy({ where: {}, cascade: true });
    await CampanaDetalle.deleteMany({});
    await NoticiaActualidad.deleteMany({});

    console.log('🧹 Wiped existing users, campaigns, details, news, cuotas, and transfers.');

    // 0. Encriptar contraseñas
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('AdminCoop2026!', salt);
    const socioPasswordHash = await bcrypt.hash('SocioCoop2026!', salt);

    // 1. Crear Admin
    const adminUser = await Usuario.create({
      email: 'admin@cooperadora.org',
      password_hash: adminPasswordHash,
      rol: 'admin'
    });
    console.log('👤 Seeded Admin: admin@cooperadora.org / AdminCoop2026!');

    // 2. Crear Socio de Prueba Oficial
    const userSocio = await Usuario.create({
      email: 'test_user_7385770550601504283@testuser.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });

    const perfilSocioDePrueba = await PerfilSocio.create({
      usuario_id_fk: userSocio.id,
      dni: 12345678,
      estado: 'activo',
      nombre: 'Socio',
      apellido: 'De Prueba',
      direccion: 'Calle Falsa 123',
      nacionalidad: 'Argentino',
      telefono: '2262112233',
      fecha_nacimiento: '1990-01-01',
      genero: 'otro',
      metodo_pago: 'debito',
      fecha_ultimo_pago: '2026-03-05',
      localidad: 'Necochea',
      observaciones: 'Socio de prueba del sistema.'
    });
    console.log(`👤 Seeded Socio Oficial: test_user_7385770550601504283@testuser.com / SocioCoop2026! (Nro Asociado: #${perfilSocioDePrueba.numero_asociado})`);

    // 3. Crear otros 4 socios de relleno con datos completos
    // Juan (Activo)
    const userJuan = await Usuario.create({
      email: 'juan.perez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    const socioJuan = await PerfilSocio.create({
      usuario_id_fk: userJuan.id,
      dni: 28456123,
      estado: 'activo',
      nombre: 'Juan Carlos',
      apellido: 'Pérez',
      direccion: 'Av. 59 1234',
      nacionalidad: 'Argentino',
      telefono: '2262551122',
      fecha_nacimiento: '1980-05-15',
      genero: 'masculino',
      metodo_pago: 'efectivo',
      fecha_ultimo_pago: '2026-05-10',
      localidad: 'Necochea',
      observaciones: 'Colaborador frecuente en campañas de pediatría.'
    });

    // María (Activo)
    const userMaria = await Usuario.create({
      email: 'maria.gomez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    const socioMaria = await PerfilSocio.create({
      usuario_id_fk: userMaria.id,
      dni: 32987456,
      estado: 'activo',
      nombre: 'María Laura',
      apellido: 'Gómez',
      direccion: 'Calle 62 2541',
      nacionalidad: 'Argentina',
      telefono: '2262553344',
      fecha_nacimiento: '1987-08-20',
      genero: 'femenino',
      metodo_pago: 'transferencia',
      fecha_ultimo_pago: '2026-06-01',
      localidad: 'Quequén',
      observaciones: 'Prefiere ser contactada por email.'
    });

    // Carlos (Pendiente)
    const userCarlos = await Usuario.create({
      email: 'carlos.rodriguez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    await PerfilSocio.create({
      usuario_id_fk: userCarlos.id,
      dni: 25123987,
      estado: 'pendiente',
      nombre: 'Carlos Alberto',
      apellido: 'Rodríguez',
      direccion: 'Calle 519 321',
      nacionalidad: 'Argentino',
      telefono: '2262555566',
      fecha_nacimiento: '1975-12-05',
      genero: 'masculino',
      metodo_pago: 'cobrador',
      fecha_ultimo_pago: null,
      localidad: 'Necochea',
      observaciones: 'Pendiente de validación de firma y entrega de formulario en papel.'
    });

    // Ana (Inactivo)
    const userAna = await Usuario.create({
      email: 'ana.martinez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    await PerfilSocio.create({
      usuario_id_fk: userAna.id,
      dni: 38456789,
      estado: 'inactivo',
      nombre: 'Ana Belén',
      apellido: 'Martínez',
      direccion: 'Calle 66 1890',
      nacionalidad: 'Argentina',
      telefono: '2262557788',
      fecha_nacimiento: '1994-03-30',
      genero: 'femenino',
      metodo_pago: 'debito',
      fecha_ultimo_pago: '2026-02-15',
      localidad: 'Necochea',
      observaciones: 'Solicitó la baja temporal por mudanza.'
    });
    // Pedro (Activo - donante frecuente)
    const userPedro = await Usuario.create({
      email: 'pedro.gomez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    await PerfilSocio.create({
      usuario_id_fk: userPedro.id,
      dni: 23567890,
      estado: 'activo',
      nombre: 'Pedro',
      apellido: 'Gómez',
      direccion: 'Calle 4 432',
      nacionalidad: 'Argentino',
      telefono: '2262559900',
      fecha_nacimiento: '1968-11-12',
      genero: 'masculino',
      metodo_pago: 'transferencia',
      fecha_ultimo_pago: '2026-06-05',
      localidad: 'Necochea',
      observaciones: 'Donante muy frecuente y participativo.'
    });

    // Sofia (Pendiente)
    const userSofia = await Usuario.create({
      email: 'sofia.lopez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    await PerfilSocio.create({
      usuario_id_fk: userSofia.id,
      dni: 41234567,
      estado: 'pendiente',
      nombre: 'Sofia',
      apellido: 'López',
      direccion: 'Av. 75 1200',
      nacionalidad: 'Argentina',
      telefono: '2262551133',
      fecha_nacimiento: '1998-02-28',
      genero: 'femenino',
      metodo_pago: 'debito',
      fecha_ultimo_pago: null,
      localidad: 'Necochea',
      observaciones: 'Falta validar la tarjeta de débito.'
    });

    console.log('👥 Seeded 6 additional mock partners (Juan, María, Carlos, Ana, Pedro, Sofia).');

    // 4. Crear Cuotas Sociales periódicas para el socio de prueba oficial
    await PagoCuota.bulkCreate([
      { socio_numero_asociado: perfilSocioDePrueba.numero_asociado, mes: 1, anio: 2026, monto: 1000.00, estado: 'pagado', fecha_pago: new Date('2026-01-05') },
      { socio_numero_asociado: perfilSocioDePrueba.numero_asociado, mes: 2, anio: 2026, monto: 1000.00, estado: 'pagado', fecha_pago: new Date('2026-02-04') },
      { socio_numero_asociado: perfilSocioDePrueba.numero_asociado, mes: 3, anio: 2026, monto: 1000.00, estado: 'pagado', fecha_pago: new Date('2026-03-05') },
      { socio_numero_asociado: perfilSocioDePrueba.numero_asociado, mes: 4, anio: 2026, monto: 1200.00, estado: 'pendiente', fecha_pago: null },
      { socio_numero_asociado: perfilSocioDePrueba.numero_asociado, mes: 5, anio: 2026, monto: 1200.00, estado: 'pendiente', fecha_pago: null }
    ]);
    console.log('🪙 Seeded monthly cuotas for the official socio.');

    // 5. Crear Campaña 1 (SQL)
    const campana1 = await CampanaEco.create({
      titulo: 'Equipamiento de Alta Complejidad para la Sala de Pediatría',
      monto_objetivo: 5000000.00,
      monto_actual: 1250000.00,
      fecha_limite: new Date('2026-12-31'),
      activo: true
    });

    // Detalle Campaña 1 (NoSQL MongoDB)
    await CampanaDetalle.create({
      campana_id_ref: campana1.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80'
        ]
      },
      obra_status: 'En Proceso de Licitación'
    });

    // 6. Crear Campaña 2 (SQL)
    const campana2 = await CampanaEco.create({
      titulo: 'Renovación de Techos y Fachada del Pabellón B',
      monto_objetivo: 8500000.00,
      monto_actual: 3400000.00,
      fecha_limite: new Date('2026-10-15'),
      activo: true
    });

    // Detalle Campaña 2 (NoSQL MongoDB)
    await CampanaDetalle.create({
      campana_id_ref: campana2.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80'
        ]
      },
      obra_status: 'Planeada (Iniciando pronto)'
    });

    // Campaña 3
    const campana3 = await CampanaEco.create({
      titulo: 'Nueva Ambulancia de Traslado Pediátrico',
      monto_objetivo: 15000000.00,
      monto_actual: 4500000.00,
      fecha_limite: new Date('2026-11-30'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana3.id,
      testimonios: [],
      galeria_rica: { videos: [], imagenes: ['https://images.unsplash.com/photo-1512426058092-23c218204b73?auto=format&fit=crop&w=600&q=80'] },
      obra_status: 'Recaudación'
    });

    // Campaña 4
    const campana4 = await CampanaEco.create({
      titulo: 'Insumos Quirúrgicos y Material Descartable',
      monto_objetivo: 2000000.00,
      monto_actual: 1800000.00,
      fecha_limite: new Date('2026-08-01'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana4.id,
      testimonios: [],
      galeria_rica: { videos: [], imagenes: ['https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=600&q=80'] },
      obra_status: 'Casi Completada'
    });

    // Campaña 5
    const campana5 = await CampanaEco.create({
      titulo: 'Campaña de Invierno: Frazadas y Calefacción',
      monto_objetivo: 1200000.00,
      monto_actual: 1200000.00,
      fecha_limite: new Date('2026-07-15'),
      activo: false
    });
    await CampanaDetalle.create({
      campana_id_ref: campana5.id,
      testimonios: [],
      galeria_rica: { videos: [], imagenes: ['https://images.unsplash.com/photo-1542485547-fc9bb02422fa?auto=format&fit=crop&w=600&q=80'] },
      obra_status: 'Finalizada y Entregada'
    });

    // Campaña 6 (Nueva)
    const campana6 = await CampanaEco.create({
      titulo: 'Modernización del Área de Neonatología y Cunas de Cuidados Especiales',
      monto_objetivo: 18500000.00,
      monto_actual: 6200000.00,
      fecha_limite: new Date('2026-11-25'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana6.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'En Ejecución',
      equipamiento_info: 'Incorporación de 2 incubadoras neonatales de alta complejidad con servocontrol térmico y 4 monitores multiparamétricos.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 7 (Nueva)
    const campana7 = await CampanaEco.create({
      titulo: 'Actualización Tecnológica de Tomografía y Diagnóstico por Imágenes',
      monto_objetivo: 28000000.00,
      monto_actual: 9850000.00,
      fecha_limite: new Date('2026-12-15'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana7.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'En Proceso de Licitación',
      equipamiento_info: 'Tubo emisor multidetector de alta resolución y software de reconstrucción volumétrica 3D para estudios de urgencia.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 8 (Nueva)
    const campana8 = await CampanaEco.create({
      titulo: 'Acondicionamiento y Humanización de la Sala de Maternidad',
      monto_objetivo: 9200000.00,
      monto_actual: 4100000.00,
      fecha_limite: new Date('2026-10-31'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana8.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'Planeada',
      equipamiento_info: 'Camas ergonómicas de Trabajo de Parto, Parto y Recuperación (TPR), monitores fetales doppler y climatización.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 9 (Nueva)
    const campana9 = await CampanaEco.create({
      titulo: 'Torre de Laparoscopía 4K para Cirugías Mínimamente Invasivas',
      monto_objetivo: 22000000.00,
      monto_actual: 14500000.00,
      fecha_limite: new Date('2026-11-15'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana9.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'En Ejecución',
      equipamiento_info: 'Torre quirúrgica de video laparoscópico con óptica 4K Ultra HD, fuente de luz fría LED e insuflador automatizado.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 10 (Nueva)
    const campana10 = await CampanaEco.create({
      titulo: 'Unidad Sanitaria Móvil para Atención y Vacunación en Barrios',
      monto_objetivo: 12400000.00,
      monto_actual: 5300000.00,
      fecha_limite: new Date('2026-12-20'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana10.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1632053002928-196160163354?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'En Ejecución',
      equipamiento_info: 'Furgón utilitario adaptado con camilla de examen, heladera de conservación térmica para vacunas y desfibrilador DEA.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 11 (Nueva)
    const campana11 = await CampanaEco.create({
      titulo: 'Gimnasio de Rehabilitación Kinesiológica y Fisioterapia',
      monto_objetivo: 7800000.00,
      monto_actual: 2650000.00,
      fecha_limite: new Date('2026-10-20'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana11.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'Planeada',
      equipamiento_info: 'Barras paralelas de reeducación de la marcha, equipo digital de magnetoterapia, ultrasonido y camillas de tracción.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
    });

    // ── OBRAS CONCRETADAS (6 Campañas Finalizadas con 100% de recaudación y fechas distintas) ──
    // Campaña 12 (Obra Concretada - Abril 2025)
    const campana12 = await CampanaEco.create({
      titulo: 'Adquisición de Nuevo Mamógrafo Digital Directo de Alta Resolución',
      monto_objetivo: 16000000.00,
      monto_actual: 16350000.00,
      fecha_limite: new Date('2025-04-18'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana12.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'Finalizada',
      equipamiento_info: 'Mamógrafo digital directo con estereotaxia para biopsias mamarias no invasivas y detección oncológica precoz.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 13 (Obra Concretada - Agosto 2025)
    const campana13 = await CampanaEco.create({
      titulo: 'Renovación Integral de Cunas y Salas de Lactario del Pabellón de Maternidad',
      monto_objetivo: 11500000.00,
      monto_actual: 11500000.00,
      fecha_limite: new Date('2025-08-22'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana13.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'Finalizada',
      equipamiento_info: 'Cunas térmicas, sillones de lactancia ergonómicos, refrigeradores biológicos para leche materna y pintura bactericida.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 14 (Obra Concretada - Noviembre 2025)
    const campana14 = await CampanaEco.create({
      titulo: 'Reacondicionamiento Integral de la Guardia Médica y Central de Shock Room',
      monto_objetivo: 14200000.00,
      monto_actual: 14800000.00,
      fecha_limite: new Date('2025-11-30'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana14.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'Finalizada',
      equipamiento_info: 'Dos camillas articuladas de trauma shock room, lámparas scialíticas móviles y paneles de oxígeno central.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 15 (Obra Concretada - Enero 2026)
    const campana15 = await CampanaEco.create({
      titulo: 'Incorporación de Respiradores y Monitores para la Unidad de Terapia Intensiva',
      monto_objetivo: 24000000.00,
      monto_actual: 24500000.00,
      fecha_limite: new Date('2026-01-20'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana15.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'Finalizada',
      equipamiento_info: 'Tres respiradores microprocesados de cuidados intensivos para adultos y bombas de infusión volumétricas.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 16 (Obra Concretada - Marzo 2026)
    const campana16 = await CampanaEco.create({
      titulo: 'Automatización del Laboratorio Central con Analizador Hematológico Digital',
      monto_objetivo: 8900000.00,
      monto_actual: 9150000.00,
      fecha_limite: new Date('2026-03-14'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana16.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'Finalizada',
      equipamiento_info: 'Autoanalizador hematológico de 5 diferenciales con capacidad de 60 muestras/hora y conexión digital con historia clínica.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80'
    });

    // Campaña 17 (Obra Concretada - Mayo 2026)
    const campana17 = await CampanaEco.create({
      titulo: 'Plaza Blanda y Espacio Lúdico en la Sala de Espera de Pediatría',
      monto_objetivo: 3800000.00,
      monto_actual: 3950000.00,
      fecha_limite: new Date('2026-05-10'),
      activo: true
    });
    await CampanaDetalle.create({
      campana_id_ref: campana17.id,
      testimonios: [],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
        ]
      },
      obra_status: 'Finalizada',
      equipamiento_info: 'Mobiliario infantil de seguridad con bordes curvos, piso antigolpes, biblioteca interactiva y paneles sensoriales.',
      equipamiento_imagen: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80'
    });

    console.log('🏥 Seeded 17 campaigns and details (5 base + 6 activas + 6 obras concretadas).');

    // 7. Noticias (NoSQL MongoDB)
    await NoticiaActualidad.create({
      titulo: 'Gran Donación Anual de la Asociación de Comerciantes',
      cuerpo_html: '<p>Gracias a la cena benéfica organizada por la <strong>Asociación de Comerciantes de Necochea</strong>, se recaudó la suma de $1.500.000 que será destinada de forma íntegra a la campaña de equipamiento de la sala de pediatría. Agradecemos profundamente el compromiso social de toda la comunidad mercantil de nuestro distrito.</p>',
      tags: ['Donaciones', 'Solidaridad', 'Pediatría'],
      imagen_url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-05-20')
    });

    await NoticiaActualidad.create({
      titulo: 'Adquisición de Nuevo Cardiodesfibrilador para Guardia Médica',
      cuerpo_html: '<p>La Cooperadora hace entrega formal de un nuevo cardiodesfibrilador de última generación para la guardia de adultos del Hospital Ferreyra. Esta adquisición fue posible gracias a la cuota mensual de nuestros socios activos y a donaciones particulares. ¡Sigamos construyendo juntos una salud pública mejor equipada!</p>',
      tags: ['Equipamiento', 'Guardia', 'Socios'],
      imagen_url: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-05-25')
    });

    await NoticiaActualidad.create({
      titulo: 'Reconocimiento a nuestros Socios Vitalicios',
      cuerpo_html: '<p>Hoy queremos rendir homenaje a todos los vecinos que nos acompañan incondicionalmente desde hace más de 20 años. Su aporte mensual ha construido gran parte de lo que hoy es nuestro Hospital.</p>',
      tags: ['Socios', 'Comunidad'],
      imagen_url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-06-01')
    });

    await NoticiaActualidad.create({
      titulo: 'Lanzamiento de nuestra Nueva Plataforma Web',
      cuerpo_html: '<p>¡Estamos muy felices de anunciar el lanzamiento oficial de nuestra plataforma de autogestión! A partir de hoy, hacer donaciones y pagar cuotas será mucho más fácil, rápido y seguro gracias a Mercado Pago.</p>',
      tags: ['Tecnología', 'Innovación', 'Noticias'],
      imagen_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-06-10')
    });

    // Nuevas 8 Noticias
    await NoticiaActualidad.create({
      titulo: 'Llegaron los nuevos ecógrafos Doppler color adquiridos gracias al aporte societario',
      cuerpo_html: '<p>La Comisión Directiva de la Cooperadora del Hospital Municipal Dr. Emilio Ferreyra se complace en informar el arribo y entrega de <strong>dos flamantes equipos de ecografía Doppler color de última generación</strong>.</p><p>Estas unidades portátiles de alta precisión estarán destinadas prioritariamente al servicio de guardia general y a los consultorios de obstetricia y ginecología, permitiendo diagnósticos inmediatos ante emergencias cardiovasculares y monitoreo fetal de alta fidelidad sin demoras operativas.</p><p>Agradecemos sinceramente a cada socio que abona su cuota social mes a mes: este logro tecnológico es fruto directo de su solidaridad incondicional con la salud pública de Necochea y Quequén.</p>',
      tags: ['Equipamiento', 'Diagnóstico', 'Socios'],
      imagen_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-06-15')
    });

    await NoticiaActualidad.create({
      titulo: 'Exitosa Jornada Solidaria «Abrazo al Ferreyra»: Récord de participación comunitaria',
      cuerpo_html: '<p>Con un marco multitudinario de familias, vecinos y referentes de instituciones intermedias, se llevó adelante en el Parque Miguel Lillo la jornada solidaria <strong>«Abrazo al Ferreyra»</strong>.</p><p>El evento contó con la participación de artistas locales, espectáculos infantiles y puestos gastronómicos solidarios coordinados por los comerciantes de la ciudad. Gracias a las donaciones voluntarias y a la venta de bonos contribución, se logró recaudar fondos clave que aceleran la meta de modernización del pabellón pediátrico.</p><p>¡Gracias Necochea por demostrar una vez más que la unión comunitaria salva vidas!</p>',
      tags: ['Comunidad', 'Solidaridad', 'Eventos'],
      imagen_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-06-22')
    });

    await NoticiaActualidad.create({
      titulo: 'Concluyó la renovación integral del sistema de aire filtrado en la Unidad de Terapia Intensiva',
      cuerpo_html: '<p>En el marco del plan de mejoras edilicias y sanitarias, finalizaron exitosamente las obras de reacondicionamiento del sistema de presurización y filtrado de aire en la <strong>Unidad de Terapia Intensiva (UTI)</strong> del hospital.</p><p>La obra contempló la colocación de filtros HEPA de eficiencia absoluta y ductos antibacterianos que aseguran la máxima pureza ambiental, reduciendo al mínimo el riesgo de infecciones intrahospitalarias en pacientes críticos. Esta intervención fue supervisada por el área de bioingeniería y homologada según la normativa vigente del Ministerio de Salud.</p>',
      tags: ['Obras', 'Infraestructura', 'Salud'],
      imagen_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-06-28')
    });

    await NoticiaActualidad.create({
      titulo: 'Capacitación continua en reanimación cardiopulmonar avanzada para enfermería pediátrica',
      cuerpo_html: '<p>Más de treinta enfermeros y técnicos de planta permanente completaron el curso intensivo de <strong>Reanimación Cardiopulmonar Pediátrica y Neonatal Avanzada</strong>, dictado en las instalaciones del nosocomio.</p><p>La capacitación, coordinada por instructores certificados de la Sociedad Argentina de Pediatría, fue solventada en su totalidad por la Cooperadora en concepto de formación continua y actualización profesional del personal de salud que cuida diariamente a nuestros niños.</p>',
      tags: ['Capacitación', 'Enfermería', 'Pediatría'],
      imagen_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-07-02')
    });

    await NoticiaActualidad.create({
      titulo: 'Firma de convenio académico y de cooperación asistencial con la Universidad Nacional',
      cuerpo_html: '<p>Se formalizó un trascendental acuerdo de articulación entre las autoridades hospitalarias, la Cooperadora y la <strong>Universidad Nacional</strong> para promover la llegada de médicos residentes y prácticas profesionales supervisadas.</p><p>Como parte del convenio, la Cooperadora acondicionará una nueva sala de ateneos clínicos y telemedicina provista de pantallas interactivas y material bibliográfico digital, estimulando la excelencia médica y el arraigo de nuevos especialistas en nuestro distrito.</p>',
      tags: ['Institucional', 'Educación', 'Medicina'],
      imagen_url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-07-06')
    });

    await NoticiaActualidad.create({
      titulo: 'Colecta histórica del Banco de Sangre con más de 120 donantes voluntarios registrados',
      cuerpo_html: '<p>Con una concurrencia ejemplar de vecinos solidarios, concluyó la jornada extraordinaria organizada por el <strong>Servicio de Hemoterapia</strong> del Hospital Ferreyra junto al voluntariado de la Cooperadora.</p><p>Se registraron más de 120 donantes voluntarios de sangre y potenciales donantes de médula ósea, garantizando el abastecimiento de hemocomponentes para cirugías programadas y urgencias traumatológicas del próximo trimestre. Agradecemos a todas las personas que se acercaron a regalar vida.</p>',
      tags: ['Comunidad', 'Donaciones', 'Hemoterapia'],
      imagen_url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-07-11')
    });

    await NoticiaActualidad.create({
      titulo: 'Inauguración de la nueva sala de espera amigable en consultorios externos pediátricos',
      cuerpo_html: '<p>Quedó oficialmente inaugurado el nuevo sector recreativo en la sala de espera de <strong>Consultorios Externos de Pediatría</strong>.</p><p>El espacio cuenta con mobiliario infantil de bordes redondeados, piso atérmico antigolpes, paneles sensoriales didácticos y un rincón de lectura infantil donado por autores necochenses. El objetivo central es humanizar la espera médica, disminuyendo los niveles de ansiedad y estrés en los más pequeños y sus familias.</p>',
      tags: ['Pediatría', 'Humanización', 'Comunidad'],
      imagen_url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-07-16')
    });

    await NoticiaActualidad.create({
      titulo: 'Presentación de memoria y balance 2025/2026: Compromiso con la transparencia',
      cuerpo_html: '<p>En cumplimiento con las normas estatutarias y reafirmando el valor ético de la transparencia, la Cooperadora presentó ante la asamblea ordinaria la <strong>Memoria y Balance General del ejercicio 2025/2026</strong>.</p><p>El dictamen contable profesional certificó que el 94,2% de los fondos ingresados a través de cuotas societarias, donaciones directas y eventos benéficos fue ejecutado en compras de aparatología médica, insumos descartables y mantenimiento de infraestructura crítica del nosocomio. El informe detallado ya se encuentra disponible para consulta de todos los socios activos.</p>',
      tags: ['Transparencia', 'Gestión', 'Asamblea'],
      imagen_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      fecha: new Date('2026-07-20')
    });

    console.log('📰 Seeded 12 news articles (4 existing + 8 new).');

    // 8. Crear Donaciones por Transferencia (SQL) vinculadas a los socios
    const now = Date.now();
    const seedDonations = [
      { usuario_id: userJuan.id, campana_id: campana1.id, monto: 15000.00, estado: 'aprobada', numero_comprobante: 'TXN-1001', hoursAgo: 2 },
      { usuario_id: userMaria.id, campana_id: campana1.id, monto: 1000.00, estado: 'aprobada', numero_comprobante: 'TXN-1002', hoursAgo: 6 },
      { usuario_id: userPedro.id, campana_id: campana1.id, monto: 5000.00, estado: 'aprobada', numero_comprobante: 'TXN-1003', hoursAgo: 18 },
      { usuario_id: userCarlos.id, campana_id: campana1.id, monto: 2000.00, estado: 'aprobada', numero_comprobante: 'TXN-1004', hoursAgo: 30 },
      { usuario_id: userSofia.id, campana_id: campana1.id, monto: 1500.00, estado: 'pendiente', numero_comprobante: 'TXN-1005', hoursAgo: 40 },

      { usuario_id: userMaria.id, campana_id: campana2.id, monto: 30000.00, estado: 'aprobada', numero_comprobante: 'TXN-2001', hoursAgo: 3 },
      { usuario_id: userPedro.id, campana_id: campana2.id, monto: 12000.00, estado: 'aprobada', numero_comprobante: 'TXN-2002', hoursAgo: 8 },
      { usuario_id: userJuan.id, campana_id: campana2.id, monto: 8000.00, estado: 'aprobada', numero_comprobante: 'TXN-2003', hoursAgo: 24 },
      { usuario_id: userAna.id, campana_id: campana2.id, monto: 4500.00, estado: 'aprobada', numero_comprobante: 'TXN-2004', hoursAgo: 52 },

      { usuario_id: userPedro.id, campana_id: campana3.id, monto: 50000.00, estado: 'aprobada', numero_comprobante: 'TXN-3001', hoursAgo: 4 },
      { usuario_id: userJuan.id, campana_id: campana3.id, monto: 25000.00, estado: 'aprobada', numero_comprobante: 'TXN-3002', hoursAgo: 14 },
      { usuario_id: userMaria.id, campana_id: campana3.id, monto: 15000.00, estado: 'aprobada', numero_comprobante: 'TXN-3003', hoursAgo: 36 },

      { usuario_id: userSofia.id, campana_id: campana4.id, monto: 10000.00, estado: 'aprobada', numero_comprobante: 'TXN-4001', hoursAgo: 5 },
      { usuario_id: userCarlos.id, campana_id: campana4.id, monto: 7500.00, estado: 'aprobada', numero_comprobante: 'TXN-4002', hoursAgo: 20 },
      { usuario_id: userAna.id, campana_id: campana4.id, monto: 5000.00, estado: 'aprobada', numero_comprobante: 'TXN-4003', hoursAgo: 44 },

      // Donaciones para las nuevas campañas
      { usuario_id: userPedro.id, campana_id: campana6.id, monto: 45000.00, estado: 'aprobada', numero_comprobante: 'TXN-6001', hoursAgo: 1 },
      { usuario_id: userJuan.id, campana_id: campana6.id, monto: 20000.00, estado: 'aprobada', numero_comprobante: 'TXN-6002', hoursAgo: 7 },
      { usuario_id: userMaria.id, campana_id: campana6.id, monto: 10000.00, estado: 'aprobada', numero_comprobante: 'TXN-6003', hoursAgo: 15 },

      { usuario_id: userJuan.id, campana_id: campana7.id, monto: 60000.00, estado: 'aprobada', numero_comprobante: 'TXN-7001', hoursAgo: 3 },
      { usuario_id: userPedro.id, campana_id: campana7.id, monto: 35000.00, estado: 'aprobada', numero_comprobante: 'TXN-7002', hoursAgo: 12 },

      { usuario_id: userMaria.id, campana_id: campana8.id, monto: 25000.00, estado: 'aprobada', numero_comprobante: 'TXN-8001', hoursAgo: 5 },
      { usuario_id: userSofia.id, campana_id: campana8.id, monto: 15000.00, estado: 'aprobada', numero_comprobante: 'TXN-8002', hoursAgo: 22 },

      { usuario_id: userPedro.id, campana_id: campana9.id, monto: 80000.00, estado: 'aprobada', numero_comprobante: 'TXN-9001', hoursAgo: 2 },
      { usuario_id: userCarlos.id, campana_id: campana9.id, monto: 18000.00, estado: 'aprobada', numero_comprobante: 'TXN-9002', hoursAgo: 16 },

      { usuario_id: userJuan.id, campana_id: campana10.id, monto: 30000.00, estado: 'aprobada', numero_comprobante: 'TXN-10001', hoursAgo: 6 },
      { usuario_id: userAna.id, campana_id: campana10.id, monto: 12000.00, estado: 'aprobada', numero_comprobante: 'TXN-10002', hoursAgo: 28 },

      { usuario_id: userMaria.id, campana_id: campana11.id, monto: 20000.00, estado: 'aprobada', numero_comprobante: 'TXN-11001', hoursAgo: 9 },
      { usuario_id: userPedro.id, campana_id: campana11.id, monto: 15000.00, estado: 'aprobada', numero_comprobante: 'TXN-11002', hoursAgo: 34 }
    ];

    for (const item of seedDonations) {
      const targetDate = new Date(now - (item.hoursAgo * 3600 * 1000));
      const don = await DonacionTransferencia.create({
        usuario_id: item.usuario_id,
        campana_id: item.campana_id,
        monto: item.monto,
        estado: item.estado,
        numero_comprobante: item.numero_comprobante,
        comprobante_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80'
      });
      await DonacionTransferencia.update(
        { updatedAt: targetDate, createdAt: targetDate },
        { where: { id: don.id }, silent: true }
      );
    }
    console.log(`💰 Seeded ${seedDonations.length} mock transfer donations with realistic donors and timestamps.`);

    console.log('🌱 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seed();
