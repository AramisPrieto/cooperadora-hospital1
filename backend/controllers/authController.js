import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario, PerfilSocio } from '../models/index.js';
import dotenv from 'dotenv';
import sequelize from '../config/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
}


// Registro de nuevos usuarios
export const register = async (req, res) => {
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
  } = req.body;

  try {
    // Validar seguridad de la contraseña
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.' });
    }

    // Validar si el usuario ya existe (Mitigación de enumeración de usuarios)
    const existingUser = await Usuario.findOne({ where: { email } });
    if (existingUser) {
      // Usamos un mensaje genérico para que un atacante no sepa si el correo existía o si falló otra cosa
      return res.status(400).json({ error: 'Error en el registro. Es posible que los datos ya estén en uso.' });
    }

    if (!dni) {
      return res.status(400).json({ error: 'Se requiere el DNI para registrar un perfil de socio.' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Crear el usuario y perfil dentro de una transacción transaccional
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
        await transaction.rollback();
        return res.status(400).json({ error: 'El DNI provisto ya está registrado para otro socio.' });
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
          estado: perfil.estado,
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          direccion: perfil.direccion,
          nacionalidad: perfil.nacionalidad,
          telefono: perfil.telefono,
          fecha_nacimiento: perfil.fecha_nacimiento,
          genero: perfil.genero,
          metodo_pago: perfil.metodo_pago,
          fecha_ultimo_pago: perfil.fecha_ultimo_pago,
          localidad: perfil.localidad,
          observaciones: perfil.observaciones
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
          estado: user.perfilSocio.estado,
          nombre: user.perfilSocio.nombre,
          apellido: user.perfilSocio.apellido,
          direccion: user.perfilSocio.direccion,
          nacionalidad: user.perfilSocio.nacionalidad,
          telefono: user.perfilSocio.telefono,
          fecha_nacimiento: user.perfilSocio.fecha_nacimiento,
          genero: user.perfilSocio.genero,
          metodo_pago: user.perfilSocio.metodo_pago,
          fecha_ultimo_pago: user.perfilSocio.fecha_ultimo_pago,
          localidad: user.perfilSocio.localidad,
          observaciones: user.perfilSocio.observaciones
        } : null
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
};
