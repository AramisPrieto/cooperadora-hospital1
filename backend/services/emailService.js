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

/**
 * Envía un correo de bienvenida tras el registro exitoso del socio
 * @param {Object} params
 * @param {string} params.email - Dirección del destinatario
 * @param {string} params.nombre - Nombre del socio
 * @param {string} params.apellido - Apellido del socio
 */
export const enviarMailBienvenida = async ({ email, nombre, apellido }) => {
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const subject = '¡Te damos la bienvenida a la Cooperadora del Hospital!';
  
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
    .welcome-box {
      background-color: #f0fdfa;
      border-left: 4px solid #0d9488;
      padding: 20px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }
    .welcome-box p {
      margin: 0;
      font-size: 16px;
      color: #0f766e;
      font-weight: 500;
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
      <h1>¡Hola, ${nombre}!</h1>
    </div>
    <div class="content">
      <p>Queremos darte la bienvenida oficial como socio de la Asociación Cooperadora del Hospital Municipal de Necochea.</p>
      
      <div class="welcome-box">
        <p>Tu solicitud de registro ha sido recibida con éxito y se encuentra en estado <strong>Pendiente de Aprobación</strong> por parte de nuestro equipo administrativo.</p>
      </div>

      <p>Una vez que sea verificada, tendrás acceso completo a tu panel para ver el estado de tus cuotas, realizar pagos y enterarte de todas las obras y novedades que hacemos gracias a tu aporte.</p>
      <p>Gracias por sumarte y comprometerte con la salud de nuestra comunidad.</p>
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
¡Te damos la bienvenida a la Cooperadora del Hospital!

Hola, ${nombre} ${apellido}.

Queremos darte la bienvenida oficial como socio de la Asociación Cooperadora del Hospital Municipal de Necochea.

Tu solicitud de registro ha sido recibida con éxito y se encuentra en estado de aprobación pendiente. Una vez que sea verificada, tendrás acceso completo a tu panel de socios.

¡Muchas gracias por tu compromiso solidario!

Asociación Cooperadora del Hospital Municipal de Necochea
  `.trim();

  if (!isResendConfigured()) {
    console.log('\n==================================================');
    console.log('📢 SIMULACIÓN DE BIENVENIDA (RESEND_API_KEY no configurada)');
    console.log(`De:      ${emailFrom}`);
    console.log(`Para:    ${email}`);
    console.log(`Asunto:  ${subject}`);
    console.log('--------------------------------------------------');
    console.log(textContent);
    console.log('==================================================\n');
    return { simulated: true, email };
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

    console.log(`[Email Service - Resend] Mail de bienvenida enviado a ${email}: ${data.id}`);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error(`[Email Service - Resend] Error al enviar bienvenida a ${email}:`, error);
    throw error;
  }
};

/**
 * Envía un correo para restablecer la contraseña del usuario
 * @param {Object} params
 * @param {string} params.email - Dirección del destinatario
 * @param {string} params.token - Token único de restablecimiento
 * @param {string} params.nombre - Nombre del usuario
 */
export const enviarMailRecuperacion = async ({ email, token, nombre }) => {
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;
  
  const subject = 'Recupera tu contraseña - Cooperadora Hospital de Necochea';

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
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn-link {
      background-color: #0d9488;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      font-weight: bold;
      border-radius: 5px;
      font-size: 16px;
      display: inline-block;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .warning-text {
      font-size: 14px;
      color: #6b7280;
      margin-top: 25px;
      border-top: 1px dashed #e5e7eb;
      padding-top: 15px;
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
      <h1>Restablecer Contraseña</h1>
    </div>
    <div class="content">
      <p>Hola, ${nombre || 'Socio'}.</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta vinculada a la Cooperadora del Hospital de Necochea. Para proceder, haz clic en el siguiente botón:</p>
      
      <div class="btn-container">
        <a href="${resetLink}" class="btn-link" target="_blank">Restablecer mi Contraseña</a>
      </div>

      <p>Este enlace es de un solo uso y expirará en 1 hora por motivos de seguridad.</p>
      
      <p class="warning-text">Si no solicitaste este cambio, puedes ignorar este correo con tranquilidad. Tu contraseña actual no sufrirá modificaciones.</p>
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
Restablecer Contraseña - Cooperadora Hospital de Necochea

Hola, ${nombre || 'Socio'}.

Recibimos una solicitud para restablecer la contraseña de tu cuenta. Puedes hacerlo ingresando al siguiente enlace (válido por 1 hora):

${resetLink}

Si no solicitaste este cambio, puedes ignorar este correo.

Asociación Cooperadora del Hospital Municipal de Necochea
  `.trim();

  if (!isResendConfigured()) {
    console.log('\n==================================================');
    console.log('📢 SIMULACIÓN DE RECUPERACIÓN (RESEND_API_KEY no configurada)');
    console.log(`De:      ${emailFrom}`);
    console.log(`Para:    ${email}`);
    console.log(`Asunto:  ${subject}`);
    console.log('--------------------------------------------------');
    console.log(textContent);
    console.log('==================================================\n');
    return { simulated: true, email };
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

    console.log(`[Email Service - Resend] Mail de recuperación enviado a ${email}: ${data.id}`);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error(`[Email Service - Resend] Error al enviar recuperación a ${email}:`, error);
    throw error;
  }
};

/**
 * Envía un correo notificando al socio que su cuenta ha sido aprobada por la administración
 * @param {Object} params
 * @param {string} params.email - Dirección del destinatario
 * @param {string} params.nombre - Nombre del socio
 */
export const enviarMailAprobacionSocio = async ({ email, nombre }) => {
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const subject = '¡Tu cuenta de socio ha sido aprobada! - Cooperadora Hospital de Necochea';

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
    .status-box {
      background-color: #f0fdfa;
      border-left: 4px solid #0d9488;
      padding: 20px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }
    .status-box p {
      margin: 0;
      font-size: 16px;
      color: #0f766e;
      font-weight: bold;
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
      <h1>¡Felicidades, ${nombre}!</h1>
    </div>
    <div class="content">
      <p>Nos alegra informarte que la Comisión Directiva de la Asociación Cooperadora del Hospital Municipal de Necochea ha aprobado tu solicitud de asociación.</p>
      
      <div class="status-box">
        <p>Estado de cuenta: ACTIVO (Aprobado)</p>
      </div>

      <p>A partir de ahora ya puedes acceder a tu panel de socio para:</p>
      <ul>
        <li>Ver tu estado de cuotas mensuales.</li>
        <li>Declarar tus pagos de cuotas por transferencia bancaria de forma directa.</li>
        <li>Gestionar tus suscripciones de pago y donaciones.</li>
      </ul>
      
      <p>Tu participación es fundamental para seguir sosteniendo y mejorando la salud pública de nuestra ciudad. ¡Muchas gracias por tu compromiso!</p>
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
¡Tu cuenta de socio ha sido aprobada! - Cooperadora Hospital de Necochea

Hola, ${nombre}.

Nos alegra informarte que la Comisión Directiva de la Asociación Cooperadora del Hospital Municipal de Necochea ha aprobado tu solicitud de asociación.

Estado de cuenta: ACTIVO (Aprobado)

A partir de ahora ya puedes acceder a tu panel de socio para ver tu estado de cuotas mensuales, declarar tus pagos por transferencia bancaria y gestionar tus suscripciones.

¡Muchas gracias por tu compromiso!

Asociación Cooperadora del Hospital Municipal de Necochea
  `.trim();

  if (!isResendConfigured()) {
    console.log('\n==================================================');
    console.log('📢 SIMULACIÓN DE APROBACIÓN DE SOCIO (RESEND_API_KEY no configurada)');
    console.log(`De:      ${emailFrom}`);
    console.log(`Para:    ${email}`);
    console.log(`Asunto:  ${subject}`);
    console.log('--------------------------------------------------');
    console.log(textContent);
    console.log('==================================================\n');
    return { simulated: true, email };
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

    console.log(`[Email Service - Resend] Mail de aprobación enviado a ${email}: ${data.id}`);
    return { sent: true, messageId: data.id };
  } catch (error) {
    console.error(`[Email Service - Resend] Error al enviar mail de aprobación a ${email}:`, error);
    throw error;
  }
};


