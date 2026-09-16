import { PerfilSocio, Usuario, PagoCuota } from '../models/index.js';
import { Op } from 'sequelize';
import { enviarMailAprobacionSocio } from './emailService.js';
import { cancelarSuscripcionSocio } from './mpService.js';

/**
 * Servicio para consultar el listado de socios con búsqueda y paginación
 */
export const listarSociosService = async ({ limit, page, search }) => {
  if (!limit && !page && !search) {
    return PerfilSocio.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['email', 'rol'] }],
      order: [['numero_asociado', 'ASC']]
    });
  }

  const parsedLimit = parseInt(limit || '20', 10);
  const parsedPage = parseInt(page || '1', 10);

  const searchInt = parseInt(search, 10);
  const whereCondition = search
    ? {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { apellido: { [Op.iLike]: `%${search}%` } },
          ...(!isNaN(searchInt) && searchInt > 0 ? [{ dni: searchInt }] : [])
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

  return {
    socios,
    total: count,
    totalPages: Math.ceil(count / parsedLimit),
    currentPage: parsedPage
  };
};

/**
 * Servicio para aprobar un socio y notificar por correo
 */
export const aprobarSocioService = async (numeroAsociado) => {
  const socio = await PerfilSocio.findByPk(numeroAsociado, {
    include: [{ model: Usuario, as: 'usuario', attributes: ['email'] }]
  });

  if (!socio) {
    const err = new Error('No se encontró el perfil de socio solicitado.');
    err.status = 404;
    throw err;
  }

  socio.estado = 'activo';
  await socio.save();

  if (socio.usuario && socio.usuario.email) {
    enviarMailAprobacionSocio({
      email: socio.usuario.email,
      nombre: socio.nombre
    }).catch(err => {
      console.error('[Mail Error] No se pudo enviar el correo de socio aprobado:', err);
    });
  }

  return socio;
};

/**
 * Servicio para rechazar un socio
 */
export const rechazarSocioService = async (numeroAsociado) => {
  const socio = await PerfilSocio.findByPk(numeroAsociado);
  if (!socio) {
    const err = new Error('No se encontró el perfil de socio solicitado.');
    err.status = 404;
    throw err;
  }

  socio.estado = 'inactivo';
  await socio.save();
  return socio;
};

/**
 * Servicio para listar cuotas paginadas
 */
export const listarCuotasService = async ({ limit, page, search }) => {
  const parsedLimit = parseInt(limit || '50', 10);
  const parsedPage = parseInt(page || '1', 10);

  const searchInt = parseInt(search, 10);
  let whereCondition = {};
  if (search) {
    whereCondition = {
      [Op.or]: [
        { '$perfilSocio.nombre$': { [Op.iLike]: `%${search}%` } },
        { '$perfilSocio.apellido$': { [Op.iLike]: `%${search}%` } },
        ...(!isNaN(searchInt) && searchInt > 0 ? [{ '$perfilSocio.dni$': searchInt }] : [])
      ]
    };
  }

  const { count, rows: cuotas } = await PagoCuota.findAndCountAll({
    where: whereCondition,
    include: [{
      model: PerfilSocio,
      as: 'perfilSocio',
      attributes: ['numero_asociado', 'nombre', 'apellido', 'dni', 'usuario_id_fk'],
      include: [{ model: Usuario, as: 'usuario', attributes: ['email'] }]
    }],
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit,
    order: [['fecha_pago', 'DESC']]
  });

  return {
    cuotas,
    total: count,
    totalPages: Math.ceil(count / parsedLimit),
    currentPage: parsedPage
  };
};
