import { PerfilSocio, Usuario, PagoCuota } from '../models/index.js';
import { Op } from 'sequelize';

// Obtener todos los perfiles de socios (Solo Admin - Soporta Paginación y Búsqueda)
export const getAllSocios = async (req, res) => {
  const { limit, page, search } = req.query;
  try {
    // Si no se proveen parámetros, retornamos la lista completa para mantener retrocompatibilidad
    if (!limit && !page && !search) {
      const socios = await PerfilSocio.findAll({
        include: [{ model: Usuario, as: 'usuario', attributes: ['email', 'rol'] }],
        order: [['numero_asociado', 'ASC']]
      });
      return res.json(socios);
    }

    const parsedLimit = parseInt(limit || '20', 10);
    const parsedPage = parseInt(page || '1', 10);

    const whereCondition = search
      ? {
          [Op.or]: [
            { nombre: { [Op.iLike]: `%${search}%` } },
            { apellido: { [Op.iLike]: `%${search}%` } },
            { dni: parseInt(search) || 0 }
          ]
        }
      : {};

    const { count, rows: socios } = await PerfilSocio.findAndCountAll({
      where: whereCondition,
      include: [{ model: Usuario, as: 'usuario', attributes: ['email', 'rol'] }],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      order: [['numero_asociado', 'ASC']]
    });

    return res.json({
      socios,
      total: count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage
    });
  } catch (error) {
    console.error('Error al obtener socios:', error);
    return res.status(500).json({ error: 'Error al obtener los socios registrados.' });
  }
};

// Obtener perfil del socio actual autenticado
export const getMyProfile = async (req, res) => {
  try {
    const profile = await PerfilSocio.findOne({
      where: { usuario_id_fk: req.user.id },
      include: [{ model: Usuario, as: 'usuario', attributes: ['email', 'rol'] }]
    });

    if (!profile) {
      return res.status(404).json({ error: 'No se encontró un perfil de socio vinculado a este usuario.' });
    }

    return res.json(profile);
  } catch (error) {
    console.error('Error al obtener perfil propio:', error);
    return res.status(500).json({ error: 'Error al obtener la información de perfil.' });
  }
};

// Obtener el historial de cuotas del socio actual autenticado
export const getMyCuotas = async (req, res) => {
  try {
    const profile = await PerfilSocio.findOne({
      where: { usuario_id_fk: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'No se encontró un perfil de socio vinculado a este usuario.' });
    }

    const cuotas = await PagoCuota.findAll({
      where: { socio_numero_asociado: profile.numero_asociado },
      order: [
        ['anio', 'DESC'],
        ['mes', 'DESC']
      ]
    });

    return res.json({
      socio: {
        numero_asociado: profile.numero_asociado,
        dni: profile.dni,
        estado: profile.estado
      },
      cuotas
    });
  } catch (error) {
    console.error('Error al obtener cuotas propias:', error);
    return res.status(500).json({ error: 'Error al obtener la información de las cuotas sociales.' });
  }
};

// Crear perfil de socio manualmente (Admin)
export const createSocio = async (req, res) => {
  const {
    usuario_id_fk,
    dni,
    estado,
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

  if (!usuario_id_fk || !dni || !nombre || !apellido || !direccion || !localidad || !nacionalidad || !telefono || !fecha_nacimiento || !genero || !metodo_pago) {
    return res.status(400).json({ error: 'Todos los campos de perfil son obligatorios (usuario_id_fk, dni, nombre, apellido, direccion, localidad, nacionalidad, telefono, fecha_nacimiento, genero, metodo_pago).' });
  }

  const dniInt = parseInt(dni);
  if (isNaN(dniInt) || dniInt < 1000000 || dniInt > 99999999) {
    return res.status(400).json({ error: 'El DNI debe ser un número válido de entre 7 y 8 dígitos.' });
  }

  // Verificar que el resto de los campos de texto no estén vacíos después de hacer trim()
  const stringFields = { nombre, apellido, direccion, localidad, nacionalidad, telefono };
  for (const [key, val] of Object.entries(stringFields)) {
    if (typeof val === 'string' && val.trim() === '') {
      return res.status(400).json({ error: `El campo ${key} no puede ser un texto vacío.` });
    }
  }

  try {
    // Validar DNI único
    const existingDni = await PerfilSocio.findOne({ where: { dni: dniInt } });
    if (existingDni) {
      return res.status(400).json({ error: 'El DNI ingresado ya existe.' });
    }

    // Validar usuario
    const user = await Usuario.findByPk(usuario_id_fk);
    if (!user) {
      return res.status(404).json({ error: 'El usuario relacional especificado no existe.' });
    }

    const nuevoSocio = await PerfilSocio.create({
      usuario_id_fk,
      dni: dniInt,
      estado: estado || 'pendiente',
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      direccion: direccion.trim(),
      nacionalidad: nacionalidad.trim(),
      telefono: telefono.trim(),
      fecha_nacimiento,
      genero,
      metodo_pago,
      fecha_ultimo_pago,
      localidad: localidad.trim(),
      observaciones
    });

    return res.status(201).json(nuevoSocio);
  } catch (error) {
    console.error('Error al crear socio:', error);
    return res.status(500).json({ error: 'Error al registrar el perfil de socio.' });
  }
};

// Actualizar perfil de socio (Admin o el propio socio)
export const updateSocio = async (req, res) => {
  const { id } = req.params; // numero_asociado
  const {
    dni,
    estado,
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

  // Validar campos obligatorios si están presentes
  const requiredStringFields = {
    nombre: 'Nombre',
    apellido: 'Apellido',
    direccion: 'Dirección',
    localidad: 'Localidad',
    nacionalidad: 'Nacionalidad',
    telefono: 'Teléfono',
    fecha_nacimiento: 'Fecha de nacimiento',
    genero: 'Género',
    metodo_pago: 'Método de pago'
  };

  for (const [key, label] of Object.entries(requiredStringFields)) {
    if (req.body[key] !== undefined) {
      const val = req.body[key];
      if (val === null || (typeof val === 'string' && val.trim() === '')) {
        return res.status(400).json({ error: `El campo ${label} es obligatorio y no puede estar vacío.` });
      }
    }
  }

  try {
    const socio = await PerfilSocio.findByPk(id);
    if (!socio) {
      return res.status(404).json({ error: 'Perfil de socio no encontrado.' });
    }

    // Restringir que un socio edite perfiles ajenos o altere su propio estado
    if (req.user.rol !== 'admin') {
      if (socio.usuario_id_fk !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para modificar este perfil.' });
      }
      if (estado && estado !== socio.estado) {
        return res.status(403).json({ error: 'Los socios no pueden cambiar su propio estado de aprobación.' });
      }
    }

    // Validar DNI único si se está modificando
    if (dni !== undefined) {
      const dniInt = parseInt(dni);
      if (isNaN(dniInt) || dniInt < 1000000 || dniInt > 99999999) {
        return res.status(400).json({ error: 'El DNI es obligatorio y debe ser un número válido de entre 7 y 8 dígitos.' });
      }
      if (dniInt !== socio.dni) {
        const existingDni = await PerfilSocio.findOne({ where: { dni: dniInt } });
        if (existingDni) {
          return res.status(400).json({ error: 'El DNI ingresado ya está en uso.' });
        }
        socio.dni = dniInt;
      }
    }

    if (estado && req.user.rol === 'admin') {
      socio.estado = estado;
    }

    if (nombre !== undefined) socio.nombre = nombre.trim();
    if (apellido !== undefined) socio.apellido = apellido.trim();
    if (direccion !== undefined) socio.direccion = direccion.trim();
    if (nacionalidad !== undefined) socio.nacionalidad = nacionalidad.trim();
    if (telefono !== undefined) socio.telefono = telefono.trim();
    if (fecha_nacimiento !== undefined) socio.fecha_nacimiento = fecha_nacimiento;
    if (genero !== undefined) socio.genero = genero;
    if (metodo_pago !== undefined && metodo_pago !== socio.metodo_pago) {
      if (req.user.rol !== 'admin') {
        const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        if (socio.mes_ultimo_cambio_metodo_pago === currentMonth) {
          if (socio.cant_cambios_metodo_pago >= 3) {
            return res.status(400).json({ error: 'No podés cambiar tu método de pago más de 3 veces en el mismo mes.' });
          }
          socio.cant_cambios_metodo_pago += 1;
        } else {
          socio.mes_ultimo_cambio_metodo_pago = currentMonth;
          socio.cant_cambios_metodo_pago = 1;
        }
      }
      socio.metodo_pago = metodo_pago;
    }
    if (fecha_ultimo_pago !== undefined) socio.fecha_ultimo_pago = fecha_ultimo_pago;
    if (localidad !== undefined) socio.localidad = localidad.trim();
    if (observaciones !== undefined) socio.observaciones = observaciones;

    await socio.save();

    return res.json({ message: 'Perfil de socio actualizado correctamente.', socio });
  } catch (error) {
    console.error('Error al actualizar socio:', error);
    return res.status(500).json({ error: 'Error al actualizar el perfil de socio.' });
  }
};

// Eliminar perfil de socio (Solo Admin)
export const deleteSocio = async (req, res) => {
  const { id } = req.params; // numero_asociado

  try {
    const socio = await PerfilSocio.findByPk(id);
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado.' });
    }

    await socio.destroy();
    return res.json({ message: 'Perfil de socio eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar socio:', error);
    return res.status(500).json({ error: 'Error al eliminar el socio.' });
  }
};
