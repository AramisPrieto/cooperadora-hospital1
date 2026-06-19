import { PerfilSocio, PagoCuota, Usuario, DonacionTransferencia, CampanaEco } from '../models/index.js';
import { crearSuscripcionSocio, cancelarSuscripcionSocio, obtenerSuscripcion } from '../services/mpService.js';
import sequelize from '../config/db.js';
import { enviarMailAgradecimiento } from '../services/emailService.js';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { flushCachePattern } from '../middleware/cacheMiddleware.js';

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

  const minimo = parseFloat(process.env.MP_MINIMO_CUOTA || '2000');
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

  if (comprobante_url && !comprobante_url.match(/^https?:\/\/.+/)) {
    return res.status(400).json({ error: 'La URL del comprobante no es válida.' });
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

import crypto from 'crypto';

/**
 * Webhook para recibir notificaciones de eventos desde Mercado Pago
 * POST /api/webhooks/mercadopago
 */
export const webhookMercadoPago = async (req, res) => {
  const signatureHeader = req.headers['x-signature'];
  const requestIdHeader = req.headers['x-request-id'];

  // 1. Validar la existencia de las cabeceras de seguridad
  if (!signatureHeader || !requestIdHeader) {
    console.warn('⚠️ [Webhook MP] Intento de acceso sin headers de firma.');
    return res.status(403).json({ error: 'Prohibido. Faltan headers de seguridad de MP.' });
  }

  // 2. Validar la firma matemática
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  const bypassSignature = process.env.BYPASS_WEBHOOK_SIGNATURE === 'true';
  
  if (!webhookSecret && !bypassSignature) {
    console.error('❌ ERROR CRÍTICO DE CONFIGURACIÓN: MP_WEBHOOK_SECRET no está configurado y no se ha activado BYPASS_WEBHOOK_SIGNATURE.');
    return res.status(500).json({ error: 'Error interno de configuración de seguridad.' });
  }

  if (webhookSecret) {
    try {
      // Extraer ts (timestamp) y v1 (hash) del header x-signature
      const signatureParts = signatureHeader.split(',');
      let ts = '';
      let v1 = '';
      
      for (const part of signatureParts) {
        const [key, value] = part.split('=');
        if (key.trim() === 'ts') ts = value.trim();
        if (key.trim() === 'v1') v1 = value.trim();
      }

      if (!ts || !v1) {
        return res.status(403).json({ error: 'Firma de webhook malformada.' });
      }

      // Mitigación de Replay Attacks: Validar antigüedad de ts
      const timestampMs = parseInt(ts, 10) * 1000;
      const currentServerTimeMs = Date.now();
      const MAX_ALLOWED_DRIFT_MS = 5 * 60 * 1000; // 5 minutos

      if (Math.abs(currentServerTimeMs - timestampMs) > MAX_ALLOWED_DRIFT_MS) {
        console.warn(`❌ [Webhook MP] Replay Attack detectado o timestamp expirado. Diferencia: ${Math.abs(currentServerTimeMs - timestampMs)}ms`);
        return res.status(403).json({ error: 'Petición expirada (Timestamp fuera de límite).' });
      }

      // Recrear la plantilla según la documentación de Mercado Pago
      const dataId = req.body.data && req.body.data.id ? req.body.data.id : '';
      const manifest = `id:${dataId};request-id:${requestIdHeader};ts:${ts};`;

      // Calcular el hash HMAC SHA256
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(manifest);
      const computedSignature = hmac.digest('hex');

      // Comparar el hash recibido con el calculado
      if (computedSignature !== v1) {
        console.error('❌ [Webhook MP] Firma inválida. Posible intento de ataque (Spoofing).');
        return res.status(403).json({ error: 'Firma inválida.' });
      }
    } catch (err) {
      console.error('Error al validar la firma del webhook:', err);
      return res.status(500).json({ error: 'Error interno en validación de webhook.' });
    }
  } else {
    console.warn('⚠️ Webhook recibido sin validación de firmas (MP_WEBHOOK_SECRET ausente, BYPASS_WEBHOOK_SIGNATURE activado).');
  }

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

    // CASO B: Recaudación de un pago recurrente exitoso o donación única (Payment)
    if (type === 'payment') {
      const paymentInstance = getMpPaymentInstance();
      const paymentDetails = await paymentInstance.get({ id: data.id });

      const extRef = paymentDetails.external_reference;
      if (!extRef) {
        console.log(`ℹ️ [Webhook MP] Pago ${data.id} no posee external_reference (no pertenece al flujo de socios o es una donación).`);
        return;
      }

      // SUB-CASO B1: Donación a Campaña
      if (extRef.startsWith('donation_')) {
        const parts = extRef.split('_'); // ['donation', 'u2', 'c1']
        const usuarioId = parseInt(parts[1].substring(1)); // Extract 2 from 'u2'
        const campanaId = parseInt(parts[2].substring(1)); // Extract 1 from 'c1'

        if (paymentDetails.status === 'approved') {
          const transaction = await sequelize.transaction();
          try {
            // Verificar si la donación ya fue registrada anteriormente
            const donacionExistente = await DonacionTransferencia.findOne({
              where: { numero_comprobante: data.id.toString() }
            });
            if (donacionExistente) {
              console.log(`ℹ [Webhook MP] La donación ${data.id} ya se encuentra registrada.`);
              await transaction.rollback();
              return;
            }

            const campana = await CampanaEco.findByPk(campanaId, { transaction, lock: transaction.LOCK.UPDATE });
            if (!campana) {
              console.warn(`⚠️ [Webhook MP] Campaña con ID ${campanaId} no encontrada para registrar donación.`);
              await transaction.rollback();
              return;
            }

            const usuario = await Usuario.findByPk(usuarioId, { transaction });
            if (!usuario) {
              console.warn(`⚠️ [Webhook MP] Usuario con ID ${usuarioId} no encontrado para registrar donación.`);
              await transaction.rollback();
              return;
            }

            // Registrar donación en SQL
            await DonacionTransferencia.create({
              usuario_id: usuarioId,
              campana_id: campanaId,
              monto: paymentDetails.transaction_amount,
              estado: 'aprobada',
              numero_comprobante: data.id.toString(),
              comprobante_url: '' // Mercado Pago payment
            }, { transaction });

            // Actualizar monto recaudado
            campana.monto_actual = parseFloat(campana.monto_actual) + parseFloat(paymentDetails.transaction_amount);
            await campana.save({ transaction });

            await transaction.commit();

            flushCachePattern('/api/campanas');

            console.log(`✅ [Webhook MP] Donación de $${paymentDetails.transaction_amount} para campaña #${campanaId} registrada con éxito.`);

            // Enviar mail agradecimiento de forma asincrónica
            enviarMailAgradecimiento({
              email: usuario.email,
              monto: paymentDetails.transaction_amount,
              campanaTitulo: campana.titulo
            }).catch(err => {
              console.error('Error al enviar email de agradecimiento por donación MP:', err);
            });

          } catch (err) {
            await transaction.rollback();
            console.error('Error al procesar la donación en la transacción del webhook:', err);
          }
        }
        return;
      }

      // SUB-CASO B2: Pago de cuota de socio
      const socioId = extRef;
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

// Redireccionar suscripción de socio de vuelta al panel
export const handleSocioMpRedirect = (req, res) => {
  const queryParams = new URLSearchParams(req.query).toString();
  const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mi-panel?status=sub_callback&${queryParams}`;
  res.redirect(frontendUrl);
};

