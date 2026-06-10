import { connectSQL } from './config/db.js';
import { Usuario } from './models/index.js';

const newEmail = process.argv[2];

if (!newEmail) {
  console.error('❌ Por favor, proporciona el nuevo email. Ejemplo: node update-email.js test_user_123456@testuser.com');
  process.exit(1);
}

async function run() {
  try {
    await connectSQL();
    const user = await Usuario.findOne({ where: { email: 'socio@cooperadora.org' } });
    
    if (!user) {
      console.error('❌ No se encontró el usuario socio@cooperadora.org. Asegúrate de haber corrido las semillas primero.');
      process.exit(1);
    }
    
    user.email = newEmail.trim();
    await user.save();
    console.log(`\n✅ Email del socio de prueba actualizado exitosamente a: ${newEmail}`);
    console.log(`👉 Ahora puedes iniciar sesión con ese email y la misma contraseña ("SocioCoop2026!") para probar.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al actualizar el email:', err);
    process.exit(1);
  }
}

run();
