import { PerfilSocio, PagoCuota, Usuario, DonacionTransferencia, CampanaEco } from '../models/index.js';
import sequelize from '../config/db.js';
import { enviarMailAgradecimiento } from './emailService.js';
import { flushCachePattern } from '../middleware/cacheMiddleware.js';
import { obtenerSuscripcion } from './mpService.js';

/**
 * Procesa la actualización de estado de suscripción de Mercado Pago (preapproval)
 */
export const procesarWebhookPreapproval = async (preapprovalId) => {
  const subDetails = await obtenerSuscripcion(preapprovalId);
  const socioId = subDetails.external_reference;
  if (!socioId) {
    console.warn(`⚠️ [Webhook MP] Suscripción ${preapprovalId} no posee external_reference (socioId).`);
    return;
  }

  const socio = await PerfilSocio.findByPk(socioId);
  if (!socio) {
    console.warn(`⚠️ [Webhook MP] Socio con ID ${socioId} no encontrado en la base de datos.`);
    return;
  }

  socio.mp_subscription_status = subDetails.status;
  if (subDetails.status === 'authorized') {
    socio.estado = 'activo';
    socio.metodo_pago = 'debito';
    socio.mp_preapproval_id = subDetails.id;
    if (subDetails.auto_recurring && subDetails.auto_recurring.transaction_amount) {
      socio.monto_cuota = subDetails.auto_recurring.transaction_amount;
    }
  } else if (subDetails.status === 'cancelled') {
    socio.estado = 'pendiente';
    socio.metodo_pago = 'transferencia';
  }

  await socio.save();
  console.log(`✅ [Webhook MP] Estado de suscripción del socio #${socioId} actualizado a "${subDetails.status}".`);
};

/**
 * Procesa el pago de una donación a campaña recibido de Mercado Pago
 */
export const procesarPagoDonacionCampana = async ({ extRef, paymentDetails, paymentId }) => {
  const parts = extRef.split('_'); // ['donation', 'u2', 'c1', 'm1500']
  const usuarioId = parseInt(parts[1].substring(1), 10);
  const campanaId = parseInt(parts[2].substring(1), 10);

  const status = paymentDetails?.status || 'approved';
  if (status !== 'approved') return;

  const montoDonacion = parseFloat(
    paymentDetails?.transaction_amount || (parts[3] ? parts[3].substring(1) : 0)
  );

  if (!montoDonacion || isNaN(montoDonacion) || montoDonacion <= 0) {
    console.warn(`⚠️ [Webhook MP] Monto inválido para donación ${paymentId}: ${montoDonacion}`);
    return;
  }

  const transaction = await sequelize.transaction();
  try {
    const donacionExistente = await DonacionTransferencia.findOne({
      where: { numero_comprobante: paymentId.toString() }
    });
    if (donacionExistente) {
      console.log(`ℹ [Webhook MP] La donación ${paymentId} ya se encuentra registrada.`);
      await transaction.rollback();
      return;
    }

    const campana = await CampanaEco.findByPk(campanaId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!campana) {
      console.warn(`⚠️ [Webhook MP] Campaña con ID ${campanaId} no encontrada.`);
      await transaction.rollback();
      return;
    }

    const usuario = await Usuario.findByPk(usuarioId, { transaction });
    if (!usuario) {
      console.warn(`⚠️ [Webhook MP] Usuario con ID ${usuarioId} no encontrado.`);
      await transaction.rollback();
      return;
    }

    await DonacionTransferencia.create({
      usuario_id: usuarioId,
      campana_id: campanaId,
      monto: montoDonacion,
      estado: 'aprobada',
      metodo: 'mercadopago',
      numero_comprobante: paymentId.toString(),
      comprobante_url: ''
    }, { transaction });

    campana.monto_actual = parseFloat(campana.monto_actual) + montoDonacion;
    await campana.save({ transaction });

    await transaction.commit();
    flushCachePattern('/api/campanas');

    console.log(`✅ [Webhook MP] Donación de $${montoDonacion} para campaña #${campanaId} registrada con éxito.`);

    enviarMailAgradecimiento({
      email: usuario.email,
      monto: montoDonacion,
      campanaTitulo: campana.titulo
    }).catch(err => {
      console.error('Error al enviar email de agradecimiento por donación MP:', err);
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Error al procesar la donación en la transacción del webhook:', err);
  }
};

/**
 * Procesa el pago de cuota social recibido de Mercado Pago
 */
export const procesarPagoCuotaSocio = async ({ socioId, paymentDetails, paymentId }) => {
  if (paymentDetails.status !== 'approved') return;

  const socio = await PerfilSocio.findByPk(socioId);
  if (!socio) {
    console.warn(`⚠️ [Webhook MP] Socio con ID ${socioId} no encontrado para procesar pago.`);
    return;
  }

  const pagoExistente = await PagoCuota.findOne({ where: { mp_payment_id: paymentId.toString() } });
  if (pagoExistente) {
    console.log(`ℹ [Webhook MP] El pago ${paymentId} ya se encuentra registrado.`);
    return;
  }

  await PagoCuota.create({
    socio_numero_asociado: socio.numero_asociado,
    monto: paymentDetails.transaction_amount,
    fecha_pago: new Date(paymentDetails.date_approved || Date.now()),
    metodo_pago: 'debito',
    mp_payment_id: paymentId.toString(),
    estado: 'aprobado'
  });

  socio.fecha_ultimo_pago = new Date(paymentDetails.date_approved || Date.now());
  socio.estado = 'activo';
  await socio.save();

  console.log(`✅ [Webhook MP] Pago de cuota de $${paymentDetails.transaction_amount} registrado con éxito para el socio #${socioId}.`);
};
