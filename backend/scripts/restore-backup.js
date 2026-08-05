import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectSQL } from './config/db.js';
import sequelize from './config/db.js';
import { Usuario, PerfilSocio, CampanaEco, DonacionTransferencia, PagoCuota } from './models/index.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupPath = path.join(__dirname, 'old_db_backup.json');

const restore = async () => {
  try {
    console.log('🔄 Iniciando restauración de base de datos desde backup...');
    
    // Verificar que el archivo existe
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Error: No se encontró el archivo de backup en ${backupPath}`);
      process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Conectar a la base de datos
    await connectSQL();

    // Sincronizar esquemas (recreando las tablas vacías)
    console.log('🧹 Vaciando y recreando tablas relacionales...');
    await sequelize.sync({ force: true });

    // 1. Restaurar Usuarios
    if (backupData.usuarios && backupData.usuarios.length > 0) {
      console.log(`👤 Insertando ${backupData.usuarios.length} usuarios...`);
      await Usuario.bulkCreate(backupData.usuarios, { validate: true });
    }

    // 2. Restaurar Campañas
    if (backupData.campanas_eco && backupData.campanas_eco.length > 0) {
      console.log(`🏥 Insertando ${backupData.campanas_eco.length} campañas...`);
      await CampanaEco.bulkCreate(backupData.campanas_eco, { validate: true });
    }

    // 3. Restaurar Perfiles de Socios
    if (backupData.perfiles_socios && backupData.perfiles_socios.length > 0) {
      console.log(`👥 Insertando ${backupData.perfiles_socios.length} perfiles de socios...`);
      await PerfilSocio.bulkCreate(backupData.perfiles_socios, { validate: true });
    }

    // 4. Restaurar Pagos de Cuotas
    if (backupData.pagos_cuotas && backupData.pagos_cuotas.length > 0) {
      console.log(`🪙 Insertando ${backupData.pagos_cuotas.length} pagos de cuotas...`);
      await PagoCuota.bulkCreate(backupData.pagos_cuotas, { validate: true });
    }

    // 5. Restaurar Donaciones por Transferencia
    if (backupData.donaciones_transferencia && backupData.donaciones_transferencia.length > 0) {
      console.log(`💰 Insertando ${backupData.donaciones_transferencia.length} donaciones por transferencia...`);
      await DonacionTransferencia.bulkCreate(backupData.donaciones_transferencia, { validate: true });
    }

    // Resetear las secuencias de PostgreSQL para evitar colisiones de IDs en el futuro
    if (sequelize.getDialect() === 'postgres') {
      console.log('🔄 Reseteando secuencias de claves primarias en PostgreSQL...');
      
      const tables = [
        { name: 'usuarios', seq: 'usuarios_id_seq', idField: 'id' },
        { name: 'campanas_eco', seq: 'campanas_eco_id_seq', idField: 'id' },
        { name: 'perfiles_socios', seq: 'perfiles_socios_numero_asociado_seq', idField: 'numero_asociado' },
        { name: 'pagos_cuotas', seq: 'pagos_cuotas_id_seq', idField: 'id' },
        { name: 'donaciones_transferencia', seq: 'donaciones_transferencia_id_seq', idField: 'id' }
      ];

      for (const table of tables) {
        try {
          await sequelize.query(
            `SELECT setval('${table.seq}', COALESCE((SELECT MAX(${table.idField}) FROM ${table.name}), 1), true)`
          );
          console.log(`✅ Secuencia reseteada con éxito para la tabla ${table.name}`);
        } catch (seqError) {
          console.warn(`⚠️ Advertencia al resetear secuencia para ${table.name}:`, seqError.message);
        }
      }
    }

    console.log('🎉 ¡Restauración completada con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la restauración:', error);
    process.exit(1);
  }
};

restore();
