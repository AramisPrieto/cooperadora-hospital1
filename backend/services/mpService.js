import { MercadoPagoConfig, PreApproval, Preference } from 'mercadopago';

// Inicializar el cliente de Mercado Pago con el token de acceso
const getMpClient = () => {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.warn('⚠️ [Mercado Pago Service] MP_ACCESS_TOKEN no configurado en el archivo .env. Las llamadas fallarán.');
  }
  return new MercadoPagoConfig({
    accessToken: token || 'TEST-MOCK-TOKEN-NOT-CONFIGURED'
  });
};

const getBackendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.BACKEND_URL || '';
  }
  return process.env.BACKEND_TUNNEL_URL || process.env.BACKEND_URL || 'http://localhost:5001';
};

/**
 * Crea una suscripción recurrente mensual (Pre-aprobación) personalizada para un socio
 * @param {Object} params
 * @param {string} params.email - Email del socio pagador (no se envía en el plan, pero lo dejamos en la firma)
 * @param {number} params.monto - Monto de la cuota mensual elegida
 * @param {string|number} params.socioId - ID/Número de asociado del socio
 * @returns {Promise<Object>} Datos de la suscripción creada (incluye init_point)
 */
export const crearSuscripcionSocio = async ({ email, monto, socioId }) => {
  const client = getMpClient();
  const preapproval = new PreApproval(client);

  const body = {
    payer_email: email,
    reason: 'Cuota Socio - Cooperadora Hospital Necochea',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: parseFloat(monto),
      currency_id: 'ARS'
    },
    back_url: `${getBackendUrl()}/api/socios/mp-redirect`,
    external_reference: socioId.toString(),
    notification_url: `${getBackendUrl()}/api/webhooks/mercadopago`
  };

  try {
    const response = await preapproval.create({ body });
    return {
      id: response.id, // ID de la suscripción
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      status: response.status
    };
  } catch (error) {
    console.error('[Mercado Pago Service] Error al crear suscripción de socio:', error);
    throw error;
  }
};

/**
 * Obtiene los detalles de una suscripción activa
 * @param {string} preapprovalId - ID de la suscripción (preapproval) en MP
 * @returns {Promise<Object>}
 */
export const obtenerSuscripcion = async (preapprovalId) => {
  const client = getMpClient();
  const preapproval = new PreApproval(client);

  try {
    return await preapproval.get({ id: preapprovalId });
  } catch (error) {
    console.error(`[Mercado Pago Service] Error al obtener suscripción ${preapprovalId}:`, error);
    throw error;
  }
};

/**
 * Cancela una suscripción activa en Mercado Pago
 * @param {string} preapprovalId - ID de la suscripción (preapproval)
 * @returns {Promise<Object>}
 */
export const cancelarSuscripcionSocio = async (preapprovalId) => {
  const client = getMpClient();
  const preapproval = new PreApproval(client);

  try {
    // Para cancelar una suscripción en MP se actualiza su estado a "cancelled"
    return await preapproval.update({
      id: preapprovalId,
      body: {
        status: 'cancelled'
      }
    });
  } catch (error) {
    console.error(`[Mercado Pago Service] Error al cancelar la suscripción ${preapprovalId}:`, error);
    throw error;
  }
};

/**
 * Crea una preferencia de pago único en Mercado Pago para una donación a campaña
 * @param {Object} params
 * @param {string} params.campanaTitulo - Título de la campaña
 * @param {number} params.monto - Monto a donar
 * @param {string|number} params.campanaId - ID de la campaña
 * @param {string|number} params.usuarioId - ID del usuario donante
 * @returns {Promise<Object>} Datos de la preferencia creada (incluye init_point)
 */
export const crearPreferenciaDonacion = async ({ campanaTitulo, monto, campanaId, usuarioId }) => {
  const client = getMpClient();
  const preference = new Preference(client);

  const body = {
    items: [
      {
        id: campanaId.toString(),
        title: `Donación Campaña - ${campanaTitulo.substring(0, 50)}`,
        quantity: 1,
        unit_price: parseFloat(monto),
        currency_id: 'ARS'
      }
    ],
    back_urls: {
      success: `${getBackendUrl()}/api/donaciones/mp-redirect?status=donation_success`,
      failure: `${getBackendUrl()}/api/donaciones/mp-redirect?status=donation_failure`,
      pending: `${getBackendUrl()}/api/donaciones/mp-redirect?status=donation_pending`
    },
    auto_return: 'approved',
    external_reference: `donation_u${usuarioId}_c${campanaId}`,
    notification_url: `${getBackendUrl()}/api/webhooks/mercadopago`
  };

  try {
    console.log('Creating MP preference with body:', JSON.stringify(body, null, 2));
    const response = await preference.create({ body });
    return {
      id: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    };
  } catch (error) {
    console.error('[Mercado Pago Service] Error al crear preferencia de donación:', error);
    throw error;
  }
};
