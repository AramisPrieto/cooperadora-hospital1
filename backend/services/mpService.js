import { MercadoPagoConfig, PreApprovalPlan, PreApproval } from 'mercadopago';

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
  const plan = new PreApprovalPlan(client);

  const body = {
    reason: 'Cuota Socio - Cooperadora Hospital Necochea',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: parseFloat(monto),
      currency_id: 'ARS'
    },
    back_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/mi-panel?status=sub_callback`
  };

  try {
    const response = await plan.create({ body });
    return {
      id: response.id, // ID del plan
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      status: response.status
    };
  } catch (error) {
    console.error('[Mercado Pago Service] Error al crear plan de suscripción:', error);
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
