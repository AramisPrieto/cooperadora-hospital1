import { PerfilSocio, PagoCuota, Usuario } from '../models/index.js';
import { crearSuscripcionSocio, cancelarSuscripcionSocio, obtenerSuscripcion } from '../services/mpService.js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Inicializar SDK para obtener detalles de pago
const getMpPaymentInstance = () => {
  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN-NOT-CONFIGURED'
  });
  return new Payment(client);
};

/**
 * Inicia el proceso de suscripción recurrente para un socio
 * POST /api/socios/suscripcion/crear
 */
export const iniciarSuscripcion = async (req, res) => {
  const { monto } = req.body;
  const usuarioId = req.user.id; // Del middleware jwt

  if (!monto || isNaN(monto)) {
    return res.status(400).json({ error: 'El monto especificado no es válido.' });
  }

  const minimo = parseFloat(process.env.MP_MINIMO_CUOTA || '1000');
  if (parseFloat(monto) < minimo) {
    return res.status(400).json({ error: `El monto mínimo de la suscripción es de $${minimo} ARS.` });
  }

  try {
    // Buscar perfil del socio
    const socio = await PerfilSocio.findOne({
      where: { usuario_id_fk: usuarioId },
      include: [{ model: Usuario, as: 'usuario', attributes: ['email'] }]
    });

    if (!socio) {
      return res.status(404).json({ error: 'No se encontró un perfil de socio para el usuario autenticado.' });
    }

    // Si ya tiene una suscripción activa o autorizada en el perfil, advertir
    if (socio.mp_subscription_status === 'authorized' && socio.mp_preapproval_id) {
      return res.status(400).json({ error: 'Ya tienes una suscripción activa en Mercado Pago. Cancélala primero si deseas cambiar el monto.' });
    }

    // Crear la suscripción en Mercado Pago
    const mpSubscription = await crearSuscripcionSocio({
      email: socio.usuario.email,
      monto: parseFloat(monto),
      socioId: socio.numero_asociado
    });

    // Guardar los datos en el perfil del socio con estado pendiente
    socio.mp_preapproval_id = mpSubscription.id;
    socio.mp_subscription_status = 'pending';
    socio.monto_cuota = parseFloat(monto);
    socio.metodo_pago = 'debito';
    await socio.save();

    return res.status(200).json({
      message: 'Suscripción iniciada correctamente.',
      initPoint: mpSubscription.init_point,
      sandboxInitPoint: mpSubscription.sandbox_init_point,
      preapprovalId: mpSubscription.id
    });
  } catch (error) {
    console.error('Error al iniciar suscripción de socio:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la suscripción.' });
  }
};

/**
 * Cancela la suscripción de Mercado Pago del socio autenticado
 * POST /api/socios/suscripcion/cancelar
 */
export const cancelarSuscripcion = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    const socio = await PerfilSocio.findOne({ where: { usuario_id_fk: usuarioId } });
    if (!socio) {
      return res.status(404).json({ error: 'No se encontró un perfil de socio para el usuario autenticado.' });
    }

    if (!socio.mp_preapproval_id) {
      return res.status(400).json({ error: 'No tienes una suscripción activa vinculada para cancelar.' });
    }

    // Cancelar en Mercado Pago
    await cancelarSuscripcionSocio(socio.mp_preapproval_id);

    // Actualizar perfil
    socio.mp_subscription_status = 'cancelled';
    // Mantenemos la referencia pero actualizamos el método de pago por defecto a transferencia/efectivo
    socio.metodo_pago = 'transferencia'; 
    await socio.save();

    return res.status(200).json({ message: 'Tu suscripción con débito automático ha sido cancelada con éxito.' });
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    return res.status(500).json({ error: 'Error interno del servidor al cancelar la suscripción.' });
  }
};

/**
 * Obtiene el historial de pagos de cuota del socio autenticado
 * GET /api/socios/mi-perfil/pagos
 */
export const obtenerMiHistorialPagos = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    const socio = await PerfilSocio.findOne({ where: { usuario_id_fk: usuarioId } });
    if (!socio) {
      return res.status(404).json({ error: 'No se encontró un perfil de socio para el usuario autenticado.' });
    }

    const pagos = await PagoCuota.findAll({
      where: { socio_numero_asociado: socio.numero_asociado },
      order: [['fecha_pago', 'DESC']]
    });

    return res.json(pagos);
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    return res.status(500).json({ error: 'Error al obtener el historial de cuotas.' });
  }
};

/**
 * Declara el pago de una cuota mensual por transferencia bancaria
 * POST /api/socios/mi-perfil/pagos/declarar
 */
export const declararPagoTransferencia = async (req, res) => {
  const { monto, numero_comprobante, comprobante_url } = req.body;
  const usuarioId = req.user.id;

  if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Por favor, ingrese un monto válido mayor a 0.' });
  }

  try {
    const socio = await PerfilSocio.findOne({ where: { usuario_id_fk: usuarioId } });
    if (!socio) {
      return res.status(404).json({ error: 'No se encontró un perfil de socio para el usuario autenticado.' });
    }

    // Registrar el pago como pendiente
    const nuevoPago = await PagoCuota.create({
      socio_numero_asociado: socio.numero_asociado,
      monto: parseFloat(monto),
      fecha_pago: new Date(),
      metodo_pago: 'transferencia',
      numero_comprobante: numero_comprobante || null,
      comprobante_url: comprobante_url || null,
      estado: 'pendiente'
    });

    // Actualizar el método de pago preferido del socio
    socio.metodo_pago = 'transferencia';
    await socio.save();

    return res.status(201).json({
      message: 'Declaración de pago registrada con éxito. Un administrador revisará la transferencia a la brevedad.',
      pago: nuevoPago
    });
  } catch (error) {
    console.error('Error al declarar transferencia de cuota:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar el pago.' });
  }
};

/**
 * Webhook para recibir notificaciones de eventos desde Mercado Pago
 * POST /api/webhooks/mercadopago
 */
export const webhookMercadoPago = async (req, res) => {
  // Respondemos inmediatamente con 200 OK a Mercado Pago para evitar reintentos duplicados por demora
  res.status(200).send('OK');

  const { type, data } = req.body;

  if (!type || !data || !data.id) {
    return;
  }

  try {
    console.log(`📡 [Webhook Mercado Pago] Recibido evento tipo "${type}" con ID: ${data.id}`);

    // CASO A: Actualización de Suscripción (Preapproval)
    if (type === 'preapproval') {
      const subDetails = await obtenerSuscripcion(data.id);
      
      const socioId = subDetails.external_reference;
      if (!socioId) {
        console.warn(`⚠️ [Webhook MP] Suscripción ${data.id} no posee external_reference (socioId).`);
        return;
      }

      const socio = await PerfilSocio.findByPk(socioId);
      if (!socio) {
        console.warn(`⚠️ [Webhook MP] Socio con ID ${socioId} no encontrado en la base de datos.`);
        return;
      }

      // Actualizar estado de la suscripción
      socio.mp_subscription_status = subDetails.status;
      
      if (subDetails.status === 'authorized') {
        socio.estado = 'activo';
        socio.metodo_pago = 'debito';
        socio.mp_preapproval_id = subDetails.id;
        if (subDetails.auto_recurring && subDetails.auto_recurring.transaction_amount) {
          socio.monto_cuota = subDetails.auto_recurring.transaction_amount;
        }
      } else if (subDetails.status === 'cancelled') {
        // Si fue cancelada desde la app de MP
        socio.estado = 'pendiente'; // o mantener inactivo/activo
        socio.metodo_pago = 'transferencia';
      }

      await socio.save();
      console.log(`✅ [Webhook MP] Estado de suscripción del socio #${socioId} actualizado a "${subDetails.status}".`);
    }

    // CASO B: Recaudación de un pago recurrente exitoso (Payment)
    if (type === 'payment') {
      const paymentInstance = getMpPaymentInstance();
      const paymentDetails = await paymentInstance.get({ id: data.id });

      const socioId = paymentDetails.external_reference;
      if (!socioId) {
        console.log(`ℹ️ [Webhook MP] Pago ${data.id} no posee external_reference (no pertenece al flujo de socios o es una donación).`);
        return;
      }

      if (paymentDetails.status === 'approved') {
        const socio = await PerfilSocio.findByPk(socioId);
        if (!socio) {
          console.warn(`⚠️ [Webhook MP] Socio con ID ${socioId} no encontrado para procesar pago.`);
          return;
        }

        // Verificar si el pago ya fue registrado anteriormente
        const pagoExistente = await PagoCuota.findOne({ where: { mp_payment_id: data.id.toString() } });
        if (pagoExistente) {
          console.log(`ℹ [Webhook MP] El pago ${data.id} ya se encuentra registrado.`);
          return;
        }

        // Registrar el pago
        await PagoCuota.create({
          socio_numero_asociado: socio.numero_asociado,
          monto: paymentDetails.transaction_amount,
          fecha_pago: new Date(paymentDetails.date_approved || Date.now()),
          metodo_pago: 'debito',
          mp_payment_id: data.id.toString(),
          estado: 'aprobado'
        });

        // Actualizar último pago y activar socio si no lo estaba
        socio.fecha_ultimo_pago = new Date(paymentDetails.date_approved || Date.now());
        socio.estado = 'activo';
        await socio.save();

        console.log(`✅ [Webhook MP] Pago de cuota de $${paymentDetails.transaction_amount} registrado con éxito para el socio #${socioId}.`);
      }
    }
  } catch (error) {
    console.error(`❌ [Webhook Mercado Pago Error] Falló al procesar evento de ID ${data.id}:`, error);
  }
};
