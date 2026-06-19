import dotenv from 'dotenv';
dotenv.config();

// Helper para verificar si Resend está configurado
const isResendConfigured = () => {
  return !!process.env.RESEND_API_KEY;
};

/**
 * Envía un correo electrónico agradeciendo la donación por transferencia utilizando Resend
 * @param {Object} params
 * @param {string} params.email - Dirección del destinatario
 * @param {number|string} params.monto - Monto de la donación
 * @param {string} params.campanaTitulo - Título de la campaña a la que se donó
 */
export const enviarMailAgradecimiento = async ({ email, monto, campanaTitulo }) => {
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const montoFormateado = parseFloat(monto).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const subject = '¡Recibimos tu donación! - Cooperadora Hospital de Necochea';

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f4f7f6;
      color: #333333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #e0e0e0;
    }
    .header {
      background: linear-gradient(135deg, #0d9488, #0f766e);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    .content p {
      margin: 0 0 20px;
      font-size: 16px;
    }
    .donation-box {
      background-color: #f0fdfa;
      border-left: 4px solid #0d9488;
      padding: 20px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }
    .donation-box ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .donation-box li {
      margin-bottom: 8px;
      font-size: 16px;
    }
    .donation-box li strong {
      color: #0f766e;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #f3f4f6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Muchas gracias por tu donación!</h1>
    </div>
    <div class="content">
      <p>Hola,</p>
      <p>Queremos informarte que hemos recibido y verificado con éxito tu transferencia bancaria. Tu aporte ya impactó en la campaña correspondiente.</p>
      
      <div class="donation-box">
        <ul>
          <li><strong>Campaña:</strong> ${campanaTitulo}</li>
          <li><strong>Monto Aportado:</strong> $${montoFormateado}</li>
          <li><strong>Estado:</strong> Confirmado por la administración</li>
        </ul>
      </div>

      <p>Este valioso gesto solidario nos permite continuar mejorando las instalaciones y el equipamiento médico de nuestro querido Hospital Municipal de Necochea.</p>
      <p>En nombre de toda la Comisión Directiva y del personal del hospital, ¡te damos las gracias de corazón!</p>
    </div>
    <div class="footer">
      <p>Asociación Cooperadora del Hospital Municipal de Necochea</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
¡Muchas gracias por tu donación!

Hola,

Queremos informarte que hemos recibido y verificado con éxito tu transferencia bancaria. Tu aporte ya impactó en la campaña correspondiente.

Detalles del aporte:
- Campaña: ${campanaTitulo}
- Monto Aportado: $${montoFormateado}
- Estado: Confirmado por la administración

Este valioso gesto solidario nos permite continuar mejorando las instalaciones y el equipamiento médico de nuestro querido Hospital Municipal de Necochea.

En nombre de toda la Comisión Directiva y del personal del hospital, ¡te damos las gracias de corazón!

Asociación Cooperadora del Hospital Municipal de Necochea
  `.trim();

  if (!isResendConfigured()) {
    // Modo simulación/desarrollo
    console.log('\n==================================================');
    console.log('📢 SIMULACIÓN DE ENVÍO DE EMAIL (RESEND_API_KEY no configurada)');
    console.log(`De:      ${emailFrom}`);
    console.log(`Para:    ${email}`);
    console.log(`Asunto:  ${subject}`);
    console.log('--------------------------------------------------');
    console.log(textContent);
    console.log('==================================================\n');
    return { simulated: true, email, monto, campanaTitulo };
  }

  // Enviar correo real usando la API de Resend por HTTPS (Puerto 443)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: email,
        subject: subject,
        html: htmlContent,
        text: textContent
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`[Email Service - Resend] Correo enviado a ${email}: ${data.id}`);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error(`[Email Service - Resend] Error al enviar correo real a ${email}:`, error);
    throw error;
  }
};
