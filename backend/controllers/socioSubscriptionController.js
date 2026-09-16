import crypto from 'crypto';
import { PerfilSocio, PagoCuota, Usuario, DonacionTransferencia, CampanaEco } from '../models/index.js';
import { crearSuscripcionSocio, cancelarSuscripcionSocio, obtenerSuscripcion } from '../services/mpService.js';
import sequelize from '../config/db.js';
import { enviarMailAgradecimiento } from '../services/emailService.js';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { flushCachePattern } from '../middleware/cacheMiddleware.js';
import {
  procesarWebhookPreapproval,
  procesarPagoDonacionCampana,
  procesarPagoCuotaSocio
} from '../services/subscriptionService.js';

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
      socioId: socio.numero_asociado,
      frontendUrl: req.body.frontend_url
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

/**
 * Webhook para recibir notificaciones de eventos desde Mercado Pago
 * POST /api/webhooks/mercadopago
 */
export const webhookMercadoPago = async (req, res) => {
  const signatureHeader = req.headers['x-signature'];
  const requestIdHeader = req.headers['x-request-id'];

  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  const bypassSignature = process.env.BYPASS_WEBHOOK_SIGNATURE === 'true' || process.env.NODE_ENV === 'development';
  
  if (!bypassSignature) {
    // 1. Validar la existencia de las cabeceras de seguridad
    if (!signatureHeader || !requestIdHeader) {
      console.warn('⚠️ [Webhook MP] Intento de acceso sin headers de firma.');
      return res.status(403).json({ error: 'Prohibido. Faltan headers de seguridad de MP.' });
    }

    // 2. Validar que tengamos el secret configurado
    if (!webhookSecret) {
      console.error('❌ ERROR CRÍTICO DE CONFIGURACIÓN: MP_WEBHOOK_SECRET no está configurado.');
      return res.status(500).json({ error: 'Error interno de configuración de seguridad.' });
    }
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
      await procesarWebhookPreapproval(data.id);
    }

    // CASO B: Recaudación de un pago recurrente exitoso o donación única (Payment)
    if (type === 'payment') {
      const paymentInstance = getMpPaymentInstance();
      const paymentDetails = await paymentInstance.get({ id: data.id });
      const extRef = paymentDetails.external_reference;

      if (!extRef) {
        console.log('ℹ️ [Webhook MP] Pago no posee external_reference:', data?.id);
        return;
      }

      if (extRef.startsWith('donation_')) {
        await procesarPagoDonacionCampana({ extRef, paymentDetails, paymentId: data.id });
      } else {
        await procesarPagoCuotaSocio({ socioId: extRef, paymentDetails, paymentId: data.id });
      }
    }
  } catch (error) {
    console.error('❌ [Webhook Mercado Pago Error] Falló al procesar evento de ID:', data?.id, error);
  }
};

const isAllowedFrontendHost = (candidate) => {
  if (!candidate || typeof candidate !== 'string') return false;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
    if (/^cooperadora-hospital(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(url.hostname)) return true;
    if (process.env.FRONTEND_URL) {
      const configured = new URL(process.env.FRONTEND_URL);
      if (url.origin === configured.origin) return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Redireccionar suscripción de socio de vuelta al panel
export const handleSocioMpRedirect = (req, res) => {
  const candidateHost = req.query.frontend_url;
  const defaultHost = process.env.FRONTEND_URL || 'http://localhost:3000';
  const frontendOrigin = isAllowedFrontendHost(candidateHost)
    ? new URL(candidateHost).origin
    : (isAllowedFrontendHost(defaultHost) ? new URL(defaultHost).origin : 'http://localhost:3000');

  const cleanParams = new URLSearchParams(req.query);
  cleanParams.delete('frontend_url');
  cleanParams.set('status', 'sub_callback');

  const redirectUrl = new URL('/mi-panel', frontendOrigin);
  redirectUrl.search = cleanParams.toString();

  res.redirect(redirectUrl.toString());
};

