import { PerfilSocio, Usuario, PagoCuota } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { enviarMailAprobacionSocio } from '../services/emailService.js';
import { cancelarSuscripcionSocio } from '../services/mpService.js';
import {
  listarSociosService,
  aprobarSocioService,
  rechazarSocioService,
  listarCuotasService
} from '../services/socioService.js';

// Obtener todos los perfiles de socios (Solo Admin - Soporta Paginación y Búsqueda)
export const getAllSocios = async (req, res) => {
  try {
    const result = await listarSociosService(req.query);
    return res.json(result);
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

// Actualizar perfil del propio socio autenticado (Autogestión)
export const updateMyProfile = async (req, res) => {
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
    const socio = await PerfilSocio.findOne({ where: { usuario_id_fk: req.user.id } });
    if (!socio) {
      return res.status(404).json({ error: 'No se encontró un perfil de socio vinculado a este usuario.' });
    }

    // Los socios no pueden cambiar su propio estado de aprobación
    if (estado && estado !== socio.estado) {
      return res.status(403).json({ error: 'Los socios no pueden cambiar su propio estado de aprobación.' });
    }

    // Los socios no pueden cambiar su fecha de último pago ni observaciones administrativas
    if (fecha_ultimo_pago !== undefined && fecha_ultimo_pago !== socio.fecha_ultimo_pago) {
      return res.status(403).json({ error: 'Los socios no pueden cambiar su propia fecha de último pago.' });
    }
    if (observaciones !== undefined && observaciones !== socio.observaciones) {
      return res.status(403).json({ error: 'Los socios no pueden editar las observaciones administrativas.' });
    }

    // Los socios no pueden modificar su propio DNI una vez registrados en el Libro de Asociados
    if (dni !== undefined) {
      const dniInt = parseInt(dni);
      if (!isNaN(dniInt) && dniInt !== socio.dni) {
        return res.status(403).json({
          error: 'El DNI no puede ser modificado por el socio. Por razones estatutarias y del Libro de Asociados, cualquier corrección debe solicitarse a la administración.'
        });
      }
    }

    if (nombre !== undefined) socio.nombre = nombre.trim();
    if (apellido !== undefined) socio.apellido = apellido.trim();
    if (direccion !== undefined) socio.direccion = direccion.trim();
    if (nacionalidad !== undefined) socio.nacionalidad = nacionalidad.trim();
    if (telefono !== undefined) socio.telefono = telefono.trim();
    if (fecha_nacimiento !== undefined) socio.fecha_nacimiento = fecha_nacimiento;
    if (genero !== undefined) socio.genero = genero;
    
    if (metodo_pago !== undefined && metodo_pago !== socio.metodo_pago) {
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
      socio.metodo_pago = metodo_pago;
    }
    
    if (localidad !== undefined) socio.localidad = localidad.trim();

    await socio.save();

    return res.json({ message: 'Perfil de socio actualizado correctamente.', socio });
  } catch (error) {
    console.error('Error al actualizar perfil propio:', error);
    return res.status(500).json({ error: 'Error al actualizar el perfil de socio.' });
  }
};

// Actualizar perfil de socio (Solo Admin)
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
    const socio = await PerfilSocio.findByPk(id, {
      include: [{ model: Usuario, as: 'usuario' }]
    });
    if (!socio) {
      return res.status(404).json({ error: 'Perfil de socio no encontrado.' });
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

    const previousEstado = socio.estado;

    if (estado !== undefined) {
      socio.estado = estado;
    }

    if (nombre !== undefined) socio.nombre = nombre.trim();
    if (apellido !== undefined) socio.apellido = apellido.trim();
    if (direccion !== undefined) socio.direccion = direccion.trim();
    if (nacionalidad !== undefined) socio.nacionalidad = nacionalidad.trim();
    if (telefono !== undefined) socio.telefono = telefono.trim();
    if (fecha_nacimiento !== undefined) socio.fecha_nacimiento = fecha_nacimiento;
    if (genero !== undefined) socio.genero = genero;
    if (metodo_pago !== undefined) {
      socio.metodo_pago = metodo_pago;
    }
    if (fecha_ultimo_pago !== undefined) socio.fecha_ultimo_pago = fecha_ultimo_pago;
    if (localidad !== undefined) socio.localidad = localidad.trim();
    if (observaciones !== undefined) socio.observaciones = observaciones;

    await socio.save();

    // Si cambia el estado a 'activo' (aprobado) y antes no lo estaba, enviar correo de aprobación
    if (estado === 'activo' && previousEstado !== 'activo' && socio.usuario) {
      enviarMailAprobacionSocio({
        email: socio.usuario.email,
        nombre: socio.nombre
      }).catch(err => console.error('Error al enviar correo de aprobación de socio:', err));
    }

    return res.json({ message: 'Perfil de socio actualizado correctamente.', socio });
  } catch (error) {
    console.error('Error al actualizar socio:', error);
    return res.status(500).json({ error: 'Error al actualizar el perfil de socio.' });
  }
};

// Baja de perfil de socio por Administrador (con preservación contable de pagos y donaciones)
export const deleteSocio = async (req, res) => {
  const { id } = req.params; // numero_asociado
  const { purgarDatos } = req.query; // Si se solicita anonimizar datos personales sensibles

  try {
    const socio = await PerfilSocio.findByPk(id, {
      include: [{ model: Usuario, as: 'usuario' }]
    });

    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado.' });
    }

    // 1. Si tenía suscripción activa en Mercado Pago, cancelarla
    if (socio.mp_preapproval_id && socio.mp_subscription_status === 'authorized') {
      try {
        await cancelarSuscripcionSocio(socio.mp_preapproval_id);
      } catch (mpErr) {
        console.warn('Advertencia al cancelar suscripción en MP durante baja administrativa:', mpErr.message);
      }
      socio.mp_subscription_status = 'cancelled';
    }

    const fechaBaja = new Date().toLocaleDateString('es-AR');

    if (purgarDatos === 'true') {
      // Anonimización contable: preserva registros de cuotas y donaciones para auditoría
      socio.nombre = 'Ex-Socio';
      socio.apellido = `#${socio.numero_asociado}`;
      socio.telefono = '0000000000';
      socio.direccion = 'Anonimizado por baja';
      socio.localidad = 'Necochea';
      socio.estado = 'inactivo';
      socio.observaciones = `${socio.observaciones || ''}\n[Baja administrativa con anonimización: ${fechaBaja}]`.trim();
      await socio.save();

      if (socio.usuario) {
        socio.usuario.email = `baja_${socio.numero_asociado}_${Date.now()}@anonimizado.local`;
        socio.usuario.password_hash = 'DISABLED_ACCOUNT';
        await socio.usuario.save();
      }

      return res.json({ message: 'Socio dado de baja y datos anonimizados preservando el balance contable.' });
    } else {
      // Baja lógica estándar
      socio.estado = 'inactivo';
      socio.observaciones = `${socio.observaciones || ''}\n[Baja administrativa: ${fechaBaja}]`.trim();
      await socio.save();

      return res.json({ message: 'Socio dado de baja exitosamente (marcado como inactivo).' });
    }
  } catch (error) {
    console.error('Error al dar de baja al socio:', error);
    return res.status(500).json({ error: 'Error al procesar la baja del socio.' });
  }
};

// Baja voluntaria de membresía solicitada por el propio socio autenticado
export const darDeBajaMiCuenta = async (req, res) => {
  const usuarioId = req.user.id;
  const { password, motivo } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Debes confirmar tu contraseña actual para dar de baja tu membresía.' });
  }

  try {
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{ model: PerfilSocio, as: 'perfilSocio' }]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'La contraseña ingresada es incorrecta.' });
    }

    const perfil = usuario.perfilSocio;
    if (perfil) {
      // 1. Cancelar suscripción activa de Mercado Pago si la tuviera
      if (perfil.mp_preapproval_id && perfil.mp_subscription_status === 'authorized') {
        try {
          await cancelarSuscripcionSocio(perfil.mp_preapproval_id);
        } catch (mpErr) {
          console.warn('Advertencia al cancelar suscripción en MP durante baja voluntaria:', mpErr.message);
        }
        perfil.mp_subscription_status = 'cancelled';
      }

      // 2. Pasar a inactivo y registrar la baja (preservando pagos históricos)
      perfil.estado = 'inactivo';
      const fechaBaja = new Date().toLocaleDateString('es-AR');
      const obsMotivo = motivo ? ` Motivo: ${motivo.trim().substring(0, 200)}.` : '';
      perfil.observaciones = `${perfil.observaciones || ''}\n[Baja voluntaria de membresía: ${fechaBaja}.${obsMotivo}]`.trim();
      await perfil.save();
    }

    // 3. Limpiar cookie de sesión
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });

    return res.json({
      message: 'Tu cuenta y membresía han sido dadas de baja correctamente. Lamentamos que te vayas.'
    });
  } catch (error) {
    console.error('Error al dar de baja la cuenta del socio:', error);
    return res.status(500).json({ error: 'Error interno al procesar la baja de la cuenta.' });
  }
};

// Obtener todas las cuotas (Solo Admin - Soporta Paginación y Búsqueda por Socio)
export const getAllCuotas = async (req, res) => {
  try {
    const result = await listarCuotasService(req.query);
    return res.json(result);
  } catch (error) {
    console.error('Error al obtener cuotas:', error);
    return res.status(500).json({ error: 'Error al obtener el historial de cuotas.' });
  }
};

// Validar una cuota (Aprobar / Rechazar) (Solo Admin)
export const validarCuota = async (req, res) => {
  const { id } = req.params; // ID de PagoCuota
  const { estado } = req.body; // 'aprobado' o 'rechazado'

  if (!['aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ error: 'El estado debe ser "aprobado" o "rechazado".' });
  }

  try {
    const cuota = await PagoCuota.findByPk(id, {
      include: [{ model: PerfilSocio, as: 'perfilSocio' }]
    });

    if (!cuota) {
      return res.status(404).json({ error: 'Cuota no encontrada.' });
    }

    cuota.estado = estado;
    await cuota.save();

    // Si se aprueba, actualizar la fecha de último pago del socio
    if (estado === 'aprobado' && cuota.perfilSocio) {
      cuota.perfilSocio.fecha_ultimo_pago = cuota.fecha_pago || new Date();
      if (cuota.perfilSocio.estado === 'pendiente') {
        cuota.perfilSocio.estado = 'activo';
      }
      await cuota.perfilSocio.save();
    }

    return res.json({ message: `Cuota ${estado} correctamente.`, cuota });
  } catch (error) {
    console.error('Error al validar cuota:', error);
    return res.status(500).json({ error: 'Error al validar la cuota.' });
  }
};

// Limpieza administrativa específica para las cuentas de Santiago Ialungo
export const limpiarCuentasSantiago = async (req, res) => {
  try {
    const { PerfilSocio, Usuario, PagoCuota, DonacionTransferencia } = await import('../models/index.js');
    
    // 1. Obtener el hash de la contraseña reciente de la cuenta 16 antes de borrarla
    const user16 = await Usuario.findOne({ where: { id: 21 } });
    const passwordHashReciente = user16 ? user16.password_hash : null;

    // 2. Eliminar registros vinculados de cuotas y transferencias de 15 y 16
    try {
      await PagoCuota.destroy({ where: { socio_numero_asociado: [15, 16] } });
    } catch (e) {
      console.warn('Sin cuotas vinculadas:', e.message);
    }
    try {
      await DonacionTransferencia.destroy({ where: { usuario_id: [20, 21] } });
    } catch (e) {
      console.warn('Sin donaciones vinculadas:', e.message);
    }

    // 3. Eliminar los perfiles de socio 15 y 16
    const sociosEliminados = await PerfilSocio.destroy({ where: { numero_asociado: [15, 16] } });

    // 4. Eliminar usuarios 20 y 21
    const usuariosEliminados = await Usuario.destroy({ where: { id: [20, 21] } });

    // 5. Actualizar el usuario 10 (asociado al socio 9) con el correo correcto y la contraseña reciente
    let usuario9Actualizado = false;
    const user10 = await Usuario.findByPk(10);
    if (user10) {
      user10.email = 'ialungosantiago@gmail.com';
      if (passwordHashReciente) {
        user10.password_hash = passwordHashReciente;
      }
      await user10.save();
      usuario9Actualizado = true;
    }

    return res.json({
      success: true,
      message: 'Limpieza realizada con éxito.',
      detalle: {
        sociosEliminados,
        usuariosEliminados,
        usuario9Actualizado,
        emailAsignado: 'ialungosantiago@gmail.com'
      }
    });
  } catch (error) {
    console.error('Error en limpiarCuentasSantiago:', error);
    return res.status(500).json({ error: error.message });
  }
};
