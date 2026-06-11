import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario, PerfilSocio } from '../models/index.js';
import sequelize from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}

/**
 * Servicio para registrar un nuevo usuario y su perfil de socio
 */
export const registerUserService = async (userData) => {
  const {
    email,
    password,
    dni,
    nombre,
    apellido,
    direccion,
    nacionalidad,
    telefono,
    fecha_nacimiento,
    genero,
    metodo_pago,
    fecha_ultimo_pago,
    localidad,
    observaciones
  } = userData;

  // Validar seguridad de la contraseña
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    const error = new Error('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.');
    error.status = 400;
    throw error;
  }

  if (!dni) {
    const error = new Error('Se requiere el DNI para registrar un perfil de socio.');
    error.status = 400;
    throw error;
  }

  // Validar si el usuario ya existe (Mitigación de enumeración de usuarios)
  const existingUser = await Usuario.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error('Error en el registro. Verifique que sus datos sean correctos o intente recuperar su cuenta si ya estaba registrado.');
    error.status = 400;
    throw error;
  }

  // Hashear contraseña
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  let user;
  let perfil = null;
  const transaction = await sequelize.transaction();

  try {
    user = await Usuario.create({
      email,
      password_hash,
      rol: 'socio'
    }, { transaction });

    // Validar DNI único dentro de la transacción
    const existingDni = await PerfilSocio.findOne({ where: { dni }, transaction });
    if (existingDni) {
      const error = new Error('Error en el registro. Verifique que sus datos sean correctos o intente recuperar su cuenta si ya estaba registrado.');
      error.status = 400;
      throw error;
    }

    perfil = await PerfilSocio.create({
      usuario_id_fk: user.id,
      dni,
      estado: 'pendiente',
      nombre,
      apellido,
      direccion,
      nacionalidad,
      telefono,
      fecha_nacimiento,
      genero,
      metodo_pago,
      fecha_ultimo_pago,
      localidad,
      observaciones
    }, { transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  // Generar token JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    user,
    perfil,
    token
  };
};

/**
 * Servicio para autenticar un usuario
 */
export const loginUserService = async (email, password) => {
  // Buscar usuario por email
  const user = await Usuario.findOne({
    where: { email },
    include: [{ model: PerfilSocio, as: 'perfilSocio' }]
  });

  if (!user) {
    const error = new Error('Credenciales inválidas.');
    error.status = 401;
    throw error;
  }

  // Validar contraseña
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Credenciales inválidas.');
    error.status = 401;
    throw error;
  }

  // Generar token JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    user,
    token
  };
};

/**
 * Servicio para obtener la sesión del usuario a partir del token
 */
export const getSessionService = async (userId) => {
  const user = await Usuario.findByPk(userId, {
    include: [{ model: PerfilSocio, as: 'perfilSocio' }]
  });

  if (!user) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  return user;
};
