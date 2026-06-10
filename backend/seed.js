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

    console.log('👥 Seeded 4 additional mock partners (Juan, María, Carlos, Ana).');

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
      testimonios: [
        { autor: 'Dra. María González (Jefa de Pediatría)', texto: 'Contar con este equipamiento nos permitirá atender casos complejos en Necochea sin necesidad de traslados urgentes.' },
        { autor: 'Juan Pérez (Vecino de Quequén)', texto: 'El hospital atendió de maravilla a mi hijo el año pasado. Estoy feliz de colaborar con este gran avance.' }
      ],
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
      testimonios: [
        { autor: 'Ing. Carlos Rossi (Director de Obras)', texto: 'Las filtraciones actuales ponen en riesgo equipamiento costoso. Esta obra es vital y urgente.' }
      ],
      galeria_rica: {
        videos: [],
        imagenes: [
          'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80'
        ]
      },
      obra_status: 'Planeada (Iniciando pronto)'
    });
    console.log('🏥 Seeded 2 campaigns and details.');

    // 7. Noticias (NoSQL MongoDB)
    await NoticiaActualidad.create({
      titulo: 'Gran Donación Anual de la Asociación de Comerciantes',
      cuerpo_html: '<p>Gracias a la cena benéfica organizada por la <strong>Asociación de Comerciantes de Necochea</strong>, se recaudó la suma de $1.500.000 que será destinada de forma íntegra a la campaña de equipamiento de la sala de pediatría. Agradecemos profundamente el compromiso social de toda la comunidad mercantil de nuestro distrito.</p>',
      tags: ['Donaciones', 'Solidaridad', 'Pediatría'],
      fecha: new Date('2026-05-20')
    });

    await NoticiaActualidad.create({
      titulo: 'Adquisición de Nuevo Cardiodesfibrilador para Guardia Médica',
      cuerpo_html: '<p>La Cooperadora hace entrega formal de un nuevo cardiodesfibrilador de última generación para la guardia de adultos del Hospital Ferreyra. Esta adquisición fue posible gracias a la cuota mensual de nuestros socios activos y a donaciones particulares. ¡Sigamos construyendo juntos una salud pública mejor equipada!</p>',
      tags: ['Equipamiento', 'Guardia', 'Socios'],
      fecha: new Date('2026-05-25')
    });
    console.log('📰 Seeded 2 news articles.');

    // 8. Crear Donaciones por Transferencia (SQL) vinculadas a los socios Juan y María
    await DonacionTransferencia.create({
      usuario_id: userJuan.id,
      campana_id: campana1.id,
      monto: 15000.00,
      estado: 'pendiente',
      numero_comprobante: 'TXN-987654321',
      comprobante_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80'
    });

    await DonacionTransferencia.create({
      usuario_id: userMaria.id,
      campana_id: campana2.id,
      monto: 30000.00,
      estado: 'aprobada',
      numero_comprobante: 'TXN-123456789',
      comprobante_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80'
    });
    console.log('💰 Seeded 2 mock transfer donations.');

    console.log('🌱 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seed();
