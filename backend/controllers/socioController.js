import { PerfilSocio, Usuario } from '../models/index.js';

// Obtener todos los perfiles de socios (Solo Admin)
export const getAllSocios = async (req, res) => {
  try {
    const socios = await PerfilSocio.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['email', 'rol'] }]
    });
    return res.json(socios);
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

// Crear perfil de socio manualmente (Admin)
export const createSocio = async (req, res) => {
  const { usuario_id_fk, dni, estado } = req.body;

  try {
    // Validar DNI único
    const existingDni = await PerfilSocio.findOne({ where: { dni } });
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
      dni,
      estado: estado || 'pendiente'
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
  const { dni, estado } = req.body;

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
    if (dni && dni !== socio.dni) {
      const existingDni = await PerfilSocio.findOne({ where: { dni } });
      if (existingDni) {
        return res.status(400).json({ error: 'El DNI ingresado ya está en uso.' });
      }
      socio.dni = dni;
    }

    if (estado && req.user.rol === 'admin') {
      socio.estado = estado;
    }

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
