// TEAM_001: Controlador para gestionar el flujo de donaciones por transferencia y su aprobación manual
import { DonacionTransferencia, CampanaEco, Usuario, PerfilSocio } from '../models/index.js';
import sequelize from '../config/db.js';
import { enviarMailAgradecimiento } from '../services/emailService.js';
import { crearPreferenciaDonacion } from '../services/mpService.js';
import { flushCachePattern } from '../middleware/cacheMiddleware.js';

// 1. Declarar una transferencia bancaria (Socio)
export const declararTransferencia = async (req, res) => {
  const { id: campanaId } = req.params;
  const { monto, numero_comprobante, comprobante_url } = req.body;
  const usuarioId = req.user.id; // Extraído del token JWT por authenticateJWT

  if (comprobante_url && !comprobante_url.match(/^https?:\/\/.+/)) {
    return res.status(400).json({ error: 'La URL del comprobante no es válida.' });
  }

  try {
    // Validar existencia de la campaña
    const campana = await CampanaEco.findByPk(campanaId);
    if (!campana) {
      return res.status(404).json({ error: 'La campaña especificada no existe.' });
    }

    if (!campana.activo) {
      return res.status(400).json({ error: 'No se pueden realizar donaciones a campañas inactivas.' });
    }

    // Validar si la campaña ya alcanzó su objetivo
    if (parseFloat(campana.monto_actual) >= parseFloat(campana.monto_objetivo)) {
      return res.status(400).json({ error: 'La campaña ya ha alcanzado su objetivo de recaudación.' });
    }

    // Validar que el monto no exceda el restante
    const restante = parseFloat(campana.monto_objetivo) - parseFloat(campana.monto_actual);
    if (parseFloat(monto) > restante) {
      return res.status(400).json({ 
        error: `El monto donado supera el límite restante de la campaña. El saldo máximo a donar es $${restante.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` 
      });
    }

    // Registrar la transferencia como pendiente
    const donacion = await DonacionTransferencia.create({
      usuario_id: usuarioId,
      campana_id: parseInt(campanaId),
      monto: parseFloat(monto),
      estado: 'pendiente',
      numero_comprobante,
      comprobante_url
    });

    return res.status(201).json({
      message: 'Declaración de transferencia registrada con éxito.',
      donacion
    });
  } catch (error) {
    console.error('Error al declarar transferencia:', error);
    return res.status(500).json({ error: 'Error interno al registrar la transferencia.' });
  }
};

// 2. Obtener todas las transferencias declaradas (Admin)
export const getTransferencias = async (req, res) => {
  try {
    const transferencias = await DonacionTransferencia.findAll({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'email'],
          include: [{
            model: PerfilSocio,
            as: 'perfilSocio',
            attributes: ['dni', 'nombre', 'apellido']
          }]
        },
        {
          model: CampanaEco,
          as: 'campana',
          attributes: ['id', 'titulo']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(transferencias);
  } catch (error) {
    console.error('Error al obtener transferencias:', error);
    return res.status(500).json({ error: 'Error al listar las transferencias declaradas.' });
  }
};

// 3. Aprobar una transferencia declarada (Admin)
export const aprobarTransferencia = async (req, res) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();

  try {
    // Buscar la transferencia incluyendo los datos del usuario y la campaña
    const donacion = await DonacionTransferencia.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'email']
        },
        {
          model: CampanaEco,
          as: 'campana',
          attributes: ['id', 'titulo']
        }
      ],
      transaction
    });
    if (!donacion) {
      await transaction.rollback();
      return res.status(404).json({ error: 'La transferencia declarada no existe.' });
    }

    // Evitar procesar dos veces
    if (donacion.estado !== 'pendiente') {
      await transaction.rollback();
      return res.status(400).json({ error: `Esta transferencia ya fue procesada y se encuentra en estado: ${donacion.estado}.` });
    }

    // Buscar y bloquear la campaña correspondiente para la actualización de fondos
    const campana = await CampanaEco.findByPk(donacion.campana_id, {
      transaction,
      lock: transaction.LOCK.UPDATE // Evita sobreescribir montos en actualizaciones concurrentes
    });

    if (!campana) {
      await transaction.rollback();
      return res.status(404).json({ error: 'La campaña asociada a esta donación ya no existe.' });
    }

    // Validar si al aprobar supera el objetivo (por si otra donación fue aprobada concurrentemente o después de que se declaró)
    const restante = parseFloat(campana.monto_objetivo) - parseFloat(campana.monto_actual);
    if (parseFloat(donacion.monto) > restante) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: `No se puede aprobar la donación porque supera el límite restante de la campaña ($${restante.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).` 
      });
    }

    // Actualizar montos y cambiar estado a aprobada
    campana.monto_actual = parseFloat(campana.monto_actual) + parseFloat(donacion.monto);
    await campana.save({ transaction });

    donacion.estado = 'aprobada';
    await donacion.save({ transaction });

    await transaction.commit();

    flushCachePattern('/api/campanas');

    // Enviar mail de agradecimiento de forma asíncrona sin bloquear la respuesta de la API
    if (donacion.usuario && donacion.usuario.email) {
      enviarMailAgradecimiento({
        email: donacion.usuario.email,
        monto: donacion.monto,
        campanaTitulo: donacion.campana ? donacion.campana.titulo : 'Campaña de la Cooperadora'
      }).catch(err => {
        console.error('[Mail Error] No se pudo enviar el correo de agradecimiento tras aprobación:', err);
      });
    }

    return res.json({
      message: 'Transferencia aprobada con éxito. El progreso de la campaña ha sido actualizado.',
      donacion,
      monto_actual_campana: campana.monto_actual
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al aprobar la transferencia:', error);
    return res.status(500).json({ error: 'Error interno al intentar aprobar la transferencia.' });
  }
};

// 4. Rechazar una transferencia declarada (Admin)
export const rechazarTransferencia = async (req, res) => {
  const { id } = req.params;

  try {
    const donacion = await DonacionTransferencia.findByPk(id);
    if (!donacion) {
      return res.status(404).json({ error: 'La transferencia declarada no existe.' });
    }

    // Evitar procesar si ya no es pendiente
    if (donacion.estado !== 'pendiente') {
      return res.status(400).json({ error: `Esta transferencia ya fue procesada y se encuentra en estado: ${donacion.estado}.` });
    }

    donacion.estado = 'rechazada';
    await donacion.save();

    return res.json({
      message: 'Transferencia rechazada con éxito.',
      donacion
    });
  } catch (error) {
    console.error('Error al rechazar la transferencia:', error);
    return res.status(500).json({ error: 'Error interno al intentar rechazar la transferencia.' });
  }
};

// 5. Obtener las transferencias declaradas por el socio actual autenticado
export const getMyDonaciones = async (req, res) => {
  try {
    const donaciones = await DonacionTransferencia.findAll({
      where: { usuario_id: req.user.id },
      include: [
        {
          model: CampanaEco,
          as: 'campana',
          attributes: ['id', 'titulo']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(donaciones);
  } catch (error) {
    console.error('Error al obtener donaciones del socio:', error);
    return res.status(500).json({ error: 'Error interno al listar las donaciones del socio.' });
  }
};

// 6. Iniciar donación con Mercado Pago (Socio)
export const crearDonacionMercadoPago = async (req, res) => {
  const { id: campanaId } = req.params;
  const { monto } = req.body;
  const usuarioId = req.user.id;

  if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Por favor, ingrese un monto válido mayor a 0.' });
  }

  try {
    // Validar existencia de la campaña
    const campana = await CampanaEco.findByPk(campanaId);
    if (!campana) {
      return res.status(404).json({ error: 'La campaña especificada no existe.' });
    }

    if (!campana.activo) {
      return res.status(400).json({ error: 'No se pueden realizar donaciones a campañas inactivas.' });
    }

    // Validar si la campaña ya alcanzó su objetivo
    if (parseFloat(campana.monto_actual) >= parseFloat(campana.monto_objetivo)) {
      return res.status(400).json({ error: 'La campaña ya ha alcanzado su objetivo de recaudación.' });
    }

    // Validar que el monto no exceda el restante
    const restante = parseFloat(campana.monto_objetivo) - parseFloat(campana.monto_actual);
    if (parseFloat(monto) > restante) {
      return res.status(400).json({ 
        error: `El monto donado supera el límite restante de la campaña. El saldo máximo a donar es $${restante.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` 
      });
    }

    // Crear preferencia en Mercado Pago
    const preference = await crearPreferenciaDonacion({
      campanaTitulo: campana.titulo,
      monto: parseFloat(monto),
      campanaId: parseInt(campanaId),
      usuarioId
    });

    return res.json(preference);
  } catch (error) {
    console.error('Error al iniciar donación Mercado Pago:', error);
    return res.status(500).json({ error: 'Error interno al iniciar el pago con Mercado Pago.' });
  }
};

// Redireccionar de vuelta al frontend (desde el túnel HTTPS al localhost HTTP)
export const handleMpRedirect = (req, res) => {
  const queryParams = new URLSearchParams(req.query).toString();
  const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?${queryParams}`;
  res.redirect(frontendUrl);
};

