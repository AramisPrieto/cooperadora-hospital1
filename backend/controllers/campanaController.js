import { CampanaEco } from '../models/index.js';
import CampanaDetalle from '../models/CampanaDetalle.js';
import sequelize from '../config/db.js';
import { flushCache } from '../middleware/cacheMiddleware.js';

// 1. OBTENER TODAS LAS CAMPAÑAS (SQL Básicas - Públicas para Home)
export const getAllCampanas = async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  try {
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);

    const campanas = await CampanaEco.findAll({
      where: { activo: true },
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit
    });
    return res.json(campanas);
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de campañas.' });
  }
};

// 2. DATA MASHUP: GET /api/campanas/:id (Autenticado - Fusión Sincrónica SQL + NoSQL)
export const getCampanaById = async (req, res) => {
  const { id } = req.params;

  try {
    // Consulta sincrónica paralela a SQL y MongoDB usando Promise.all
    const [sqlData, nosqlData] = await Promise.all([
      CampanaEco.findByPk(id),
      CampanaDetalle.findOne({ campana_id_ref: parseInt(id) })
    ]);

    if (!sqlData) {
      return res.status(404).json({ error: 'Campaña no encontrada en la base de datos relacional.' });
    }

    // Convertir a objeto plano para evitar problemas de clonación de Mongoose en la caché
    const nosqlObj = nosqlData ? nosqlData.toObject() : null;

    // Fusión de Datos (Mashup) en un único objeto JSON unificado
    const campanaMashup = {
      id: sqlData.id,
      titulo: sqlData.titulo,
      monto_objetivo: parseFloat(sqlData.monto_objetivo),
      monto_actual: parseFloat(sqlData.monto_actual),
      fecha_limite: sqlData.fecha_limite,
      activo: sqlData.activo,
      es_campana_del_mes: sqlData.es_campana_del_mes,
      createdAt: sqlData.createdAt,
      updatedAt: sqlData.updatedAt,
      // Datos provenientes de NoSQL MongoDB
      detalles: nosqlObj ? {
        testimonios: nosqlObj.testimonios,
        galeria_rica: nosqlObj.galeria_rica,
        obra_status: nosqlObj.obra_status,
        mongoId: nosqlObj._id
      } : {
        testimonios: [],
        galeria_rica: { videos: [], imagenes: [] },
        obra_status: 'No especificado (Sin detalles de campaña)'
      }
    };

    return res.json(campanaMashup);

  } catch (error) {
    console.error('Error en Data Mashup de Campaña:', error);
    return res.status(500).json({ error: 'Error al procesar la combinación de datos de la campaña.' });
  }
};

// 3. CREAR CAMPAÑA (Solo Admin - SQL + NoSQL)
export const createCampana = async (req, res) => {
  const { titulo, monto_objetivo, monto_actual, fecha_limite, es_campana_del_mes, testimonios, galeria_rica, obra_status } = req.body;

  if (monto_objetivo < 0 || (monto_actual && monto_actual < 0)) {
    return res.status(400).json({ error: 'Los montos económicos no pueden ser negativos.' });
  }

  // Iniciamos una transacción en SQL
  const transaction = await sequelize.transaction();

  try {
    // Si se establece como campaña del mes, desactivar las demás dentro de la transacción
    if (es_campana_del_mes === true) {
      await CampanaEco.update({ es_campana_del_mes: false }, { where: {}, transaction });
    }

    // 1. Guardar progreso financiero en SQL (Transaccional)
    const sqlCampana = await CampanaEco.create({
      titulo,
      monto_objetivo,
      monto_actual: monto_actual || 0.00,
      fecha_limite,
      activo: true,
      es_campana_del_mes: es_campana_del_mes || false
    }, { transaction });

    // 2. Guardar detalles enriquecidos y multimedia en NoSQL (MongoDB)
    try {
      const nosqlCampana = await CampanaDetalle.create({
        campana_id_ref: sqlCampana.id,
        testimonios: testimonios || [],
        galeria_rica: galeria_rica || { videos: [], imagenes: [] },
        obra_status: obra_status || 'Planeada'
      });

      // Confirmar la transacción SQL una vez que MongoDB también se completó
      await transaction.commit();

      flushCache();

      return res.status(201).json({
        message: 'Campaña creada exitosamente en ambas bases de datos.',
        campana: {
          ...sqlCampana.toJSON(),
          detalles: nosqlCampana
        }
      });
    } catch (mongoError) {
      console.error('Error al insertar en MongoDB. Revirtiendo transacción SQL:', mongoError);
      throw new Error('Fallo al registrar detalles de la campaña en NoSQL (MongoDB).');
    }

  } catch (error) {
    // Revertir cambios en SQL ante cualquier error
    await transaction.rollback();
    console.error('Error al crear campaña:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor al crear la campaña.' });
  }
};

// 4. ACTUALIZAR CAMPAÑA (Solo Admin - SQL + NoSQL)
export const updateCampana = async (req, res) => {
  const { id } = req.params;
  const { titulo, monto_objetivo, monto_actual, fecha_limite, activo, es_campana_del_mes, testimonios, galeria_rica, obra_status } = req.body;

  if (monto_objetivo < 0 || (monto_actual && monto_actual < 0)) {
    return res.status(400).json({ error: 'Los montos económicos no pueden ser negativos.' });
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Buscar en SQL con la transacción
    const sqlCampana = await CampanaEco.findByPk(id, { transaction });
    if (!sqlCampana) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Campaña relacional no encontrada.' });
    }

    // Actualizar SQL
    if (titulo !== undefined) sqlCampana.titulo = titulo;
    if (monto_objetivo !== undefined) sqlCampana.monto_objetivo = monto_objetivo;
    if (monto_actual !== undefined) sqlCampana.monto_actual = monto_actual;
    if (fecha_limite !== undefined) sqlCampana.fecha_limite = fecha_limite;
    if (activo !== undefined) sqlCampana.activo = activo;
    if (es_campana_del_mes !== undefined) {
      if (es_campana_del_mes === true) {
        await CampanaEco.update({ es_campana_del_mes: false }, { where: {}, transaction });
        sqlCampana.es_campana_del_mes = true;
      } else {
        sqlCampana.es_campana_del_mes = false;
      }
    }
    await sqlCampana.save({ transaction });

    // 2. Buscar y actualizar en MongoDB
    let nosqlCampana = await CampanaDetalle.findOne({ campana_id_ref: parseInt(id) });
    if (!nosqlCampana) {
      nosqlCampana = new CampanaDetalle({ campana_id_ref: sqlCampana.id });
    }

    if (testimonios !== undefined) nosqlCampana.testimonios = testimonios;
    if (galeria_rica !== undefined) nosqlCampana.galeria_rica = galeria_rica;
    if (obra_status !== undefined) nosqlCampana.obra_status = obra_status;
    await nosqlCampana.save();

    // Confirmar transacción SQL si todo salió bien
    await transaction.commit();

    flushCache();

    return res.json({
      message: 'Campaña actualizada exitosamente en bases híbridas.',
      campana: {
        ...sqlCampana.toJSON(),
        detalles: nosqlCampana
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar campaña:', error);
    return res.status(500).json({ error: 'Error al actualizar la campaña.' });
  }
};

// 5. ELIMINAR CAMPAÑA (Solo Admin - SQL + NoSQL)
export const deleteCampana = async (req, res) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();

  try {
    const sqlCampana = await CampanaEco.findByPk(id, { transaction });
    if (!sqlCampana) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Campaña relacional no encontrada.' });
    }

    // 1. Eliminar SQL
    await sqlCampana.destroy({ transaction });

    // 2. Eliminar NoSQL correspondiente
    await CampanaDetalle.deleteOne({ campana_id_ref: parseInt(id) });

    await transaction.commit();

    flushCache();

    return res.json({ message: 'Campaña y sus detalles eliminados de ambas bases de datos.' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar campaña:', error);
    return res.status(500).json({ error: 'Error al eliminar la campaña.' });
  }
};


