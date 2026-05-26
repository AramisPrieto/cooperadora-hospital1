import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario, PerfilSocio } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Registro de nuevos usuarios
export const register = async (req, res) => {
  const { email, password, dni } = req.body;

  try {
    // Validar si el usuario ya existe
    const existingUser = await Usuario.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya se encuentra registrado.' });
    }

    if (!dni) {
      return res.status(400).json({ error: 'Se requiere el DNI para registrar un perfil de socio.' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Crear el usuario — rol siempre 'socio', los admins se crean desde la base de datos
    const user = await Usuario.create({
      email,
      password_hash,
      rol: 'socio'
    });

    let perfil = null;
    // Crear automáticamente el perfil de socio
    {
      // Validar DNI único
      const existingDni = await PerfilSocio.findOne({ where: { dni } });
      if (existingDni) {
        // Borrar el usuario creado para mantener integridad
        await user.destroy();
        return res.status(400).json({ error: 'El DNI provisto ya está registrado para otro socio.' });
      }

      perfil = await PerfilSocio.create({
        usuario_id_fk: user.id,
        dni,
        estado: 'pendiente' // Por defecto ingresa como pendiente de aprobación física
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        perfil: perfil ? {
          numero_asociado: perfil.numero_asociado,
          dni: perfil.dni,
          estado: perfil.estado
        } : null
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar usuario.' });
  }
};

// Login de usuarios
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario por email
    const user = await Usuario.findOne({
      where: { email },
      include: [{ model: PerfilSocio, as: 'perfilSocio' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Validar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        perfil: user.perfilSocio ? {
          numero_asociado: user.perfilSocio.numero_asociado,
          dni: user.perfilSocio.dni,
          estado: user.perfilSocio.estado
        } : null
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
};
