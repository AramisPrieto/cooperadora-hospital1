import bcrypt from 'bcryptjs';
import { connectSQL } from './config/db.js';
import { Usuario } from './models/index.js';

const createAdmin = async () => {
  try {
    await connectSQL();

    const email = process.env.ADMIN_EMAIL || 'admin@cooperadora.org';
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      console.error('❌ Error: Debes definir la variable de entorno ADMIN_PASSWORD para poder registrar un usuario administrativo.');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Eliminar admin existente si hay uno roto
    await Usuario.destroy({ where: { email } });

    const user = await Usuario.create({
      email,
      password_hash,
      rol: 'admin'
    });

    console.log('✅ Admin creado exitosamente:');
    console.log(`   Email:    ${email}`);
    console.log('   Password: [CONFIGURED IN ENVIRONMENT]');
    console.log('   ID:       ', user.id);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creando admin:', err.message);
    process.exit(1);
  }
};

createAdmin();
