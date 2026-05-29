import { connectSQL } from './config/db.js';
import { connectMongoDB } from './config/mongo.js';
import sequelize from './config/db.js';
import { CampanaEco } from './models/index.js';
import CampanaDetalle from './models/CampanaDetalle.js';
import NoticiaActualidad from './models/NoticiaActualidad.js';

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    await connectSQL();
    await connectMongoDB();

    // Limpiar base de datos
    // Usamos Sequelize para limpiar SQL y Mongoose para NoSQL
    await CampanaEco.destroy({ where: {}, cascade: true });
    await CampanaDetalle.deleteMany({});
    await NoticiaActualidad.deleteMany({});

    console.log('🧹 Wiped existing campaigns, campaign details, and news.');

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

    console.log('🌱 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seed();
