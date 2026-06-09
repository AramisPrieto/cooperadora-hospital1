import bcrypt from 'bcryptjs';
import { connectSQL } from './config/db.js';
import { Usuario } from './models/index.js';

const checkUsers = async () => {
  try {
    await connectSQL();
    const users = await Usuario.findAll();
    console.log(`Found ${users.length} users in the database:`);
    for (const u of users) {
      const isSocioMatch = await bcrypt.compare('socio123', u.password_hash);
      const isAdminMatch = await bcrypt.compare('admin123', u.password_hash);
      console.log(`- Email: ${u.email}`);
      console.log(`  Role:  ${u.rol}`);
      console.log(`  Password Match socio123: ${isSocioMatch}`);
      console.log(`  Password Match admin123: ${isAdminMatch}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkUsers();
