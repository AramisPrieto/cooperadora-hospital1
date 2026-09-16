import dotenv from 'dotenv';
import {
  renderAgradecimientoTemplate,
  renderBienvenidaTemplate,
  renderRecuperacionTemplate,
  renderAprobacionSocioTemplate
} from './templates/emailTemplates.js';

dotenv.config();

// Helper para verificar si Resend está configurado
const isResendConfigured = () => {
  return !!process.env.RESEND_API_KEY;
};

/**
 * Función genérica de despacho vía Resend API (HTTPS Puerto 443) o simulación en consola
 */
const sendEmail = async ({ to, subject, html, text, logLabel }) => {
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!isResendConfigured()) {
    console.log('\n==================================================');
    console.log(`📢 SIMULACIÓN DE ENVÍO DE EMAIL [${logLabel}] (RESEND_API_KEY no configurada)`);
    console.log(`De:      ${emailFrom}`);
    console.log(`Para:    ${to}`);
    console.log(`Asunto:  ${subject}`);
    console.log('--------------------------------------------------');
    console.log(text);
    console.log('==================================================\n');
    return { simulated: true, to, subject };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to,
        subject,
        html,
        text
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`[Email Service - Resend] ${logLabel} enviado a ${to}: ${data.id}`);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error(`[Email Service - Resend] Error al enviar ${logLabel} a ${to}:`, error);
    throw error;
  }
};

/**
 * Envía un correo electrónico agradeciendo la donación por transferencia
 */
export const enviarMailAgradecimiento = async ({ email, monto, campanaTitulo }) => {
  const montoFormateado = parseFloat(monto).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const subject = '¡Recibimos tu donación! - Cooperadora Hospital de Necochea';
  const { htmlContent, textContent } = renderAgradecimientoTemplate({
    campanaTitulo,
    montoFormateado
  });

  return sendEmail({
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
    logLabel: 'Agradecimiento de donación'
  });
};

/**
 * Envía un correo de bienvenida tras el registro exitoso del socio
 */
export const enviarMailBienvenida = async ({ email, nombre, apellido }) => {
  const subject = '¡Te damos la bienvenida a la Cooperadora del Hospital!';
  const { htmlContent, textContent } = renderBienvenidaTemplate({ nombre, apellido });

  return sendEmail({
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
    logLabel: 'Bienvenida de nuevo socio'
  });
};

/**
 * Envía un correo para restablecer la contraseña del usuario
 */
export const enviarMailRecuperacion = async ({ email, token, nombre, frontendUrl }) => {
  const resolvedFrontendUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${resolvedFrontendUrl}/reset-password?token=${token}`;
  const subject = 'Recupera tu contraseña - Cooperadora Hospital de Necochea';

  const { htmlContent, textContent } = renderRecuperacionTemplate({
    nombre,
    resetLink
  });

  return sendEmail({
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
    logLabel: 'Recuperación de contraseña'
  });
};

/**
 * Envía un correo notificando al socio que su cuenta ha sido aprobada por la administración
 */
export const enviarMailAprobacionSocio = async ({ email, nombre }) => {
  const subject = '¡Tu cuenta de socio ha sido aprobada! - Cooperadora Hospital de Necochea';
  const { htmlContent, textContent } = renderAprobacionSocioTemplate({ nombre });

  return sendEmail({
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
    logLabel: 'Aprobación de socio'
  });
};
