import bcrypt from 'bcryptjs';
import { connectSQL } from './config/db.js';
import { Usuario } from './models/index.js';

const createAdmin = async () => {
  try {
    await connectSQL();

    const email = 'admin@cooperadora.org';
    const password = 'admin123';
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
    console.log('   Email:    admin@cooperadora.org');
    console.log('   Password: admin123');
    console.log('   ID:       ', user.id);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creando admin:', err.message);
    process.exit(1);
  }
};

createAdmin();
