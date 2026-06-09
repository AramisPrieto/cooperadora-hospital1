import bcrypt from 'bcryptjs';
import { connectSQL } from './config/db.js';
import { connectMongoDB } from './config/mongo.js';
import sequelize from './config/db.js';
import { CampanaEco, Usuario, PerfilSocio, DonacionTransferencia } from './models/index.js';
import CampanaDetalle from './models/CampanaDetalle.js';
import NoticiaActualidad from './models/NoticiaActualidad.js';

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    await connectSQL();
    await connectMongoDB();

    // Limpiar base de datos
    // Usamos Sequelize para limpiar SQL y Mongoose para NoSQL
    await DonacionTransferencia.destroy({ where: {} });
    await PerfilSocio.destroy({ where: {} });
    await Usuario.destroy({ where: {} });
    await CampanaEco.destroy({ where: {}, cascade: true });
    await CampanaDetalle.deleteMany({});
    await NoticiaActualidad.deleteMany({});

    console.log('🧹 Wiped existing campaigns, campaign details, news, transfers, profiles, and users.');

    // 0. Crear usuarios y perfiles de socios de relleno
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const socioPasswordHash = await bcrypt.hash('socio123', salt);

    // Crear Admin
    const adminUser = await Usuario.create({
      email: 'admin@cooperadora.org',
      password_hash: adminPasswordHash,
      rol: 'admin'
    });

    // Socio 1 (Activo)
    const user1 = await Usuario.create({
      email: 'juan.perez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    const socio1 = await PerfilSocio.create({
      usuario_id_fk: user1.id,
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

    // Socio 2 (Activo)
    const user2 = await Usuario.create({
      email: 'maria.gomez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    const socio2 = await PerfilSocio.create({
      usuario_id_fk: user2.id,
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

    // Socio 3 (Pendiente)
    const user3 = await Usuario.create({
      email: 'carlos.rodriguez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    const socio3 = await PerfilSocio.create({
      usuario_id_fk: user3.id,
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

    // Socio 4 (Inactivo)
    const user4 = await Usuario.create({
      email: 'ana.martinez@email.com',
      password_hash: socioPasswordHash,
      rol: 'socio'
    });
    const socio4 = await PerfilSocio.create({
      usuario_id_fk: user4.id,
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

    console.log('👥 Seeded admin and 4 mock partners (Juan, María, Carlos, Ana).');

    // 1. Campaña 1 (SQL)
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

    // 2. Campaña 2 (SQL)
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

    // 3. Noticias (NoSQL MongoDB)
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

    // 4. Donaciones por Transferencia (SQL)
    await DonacionTransferencia.create({
      usuario_id: user1.id,
      campana_id: campana1.id,
      monto: 15000.00,
      estado: 'pendiente',
      numero_comprobante: 'TXN-987654321',
      comprobante_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80'
    });

    await DonacionTransferencia.create({
      usuario_id: user2.id,
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
