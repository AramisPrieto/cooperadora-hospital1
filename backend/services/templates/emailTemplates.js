/**
 * Plantillas HTML y de texto plano para las comunicaciones por correo electrónico
 * de la Asociación Cooperadora del Hospital Municipal de Necochea.
 */

const baseEmailStyle = `
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
  .footer {
    background-color: #f9fafb;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    border-top: 1px solid #f3f4f6;
  }
`;

/**
 * Plantilla de Agradecimiento por Donación
 */
export const renderAgradecimientoTemplate = ({ campanaTitulo, montoFormateado }) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    ${baseEmailStyle}
    .donation-box {
      background-color: #f0fdfa;
      border-left: 4px solid #0d9488;
      padding: 20px;
      margin: 25px 0;
      border-radius: 0 4px 4px 0;
    }
    .donation-box ul {
      margin: 0;
      padding-left: 20px;
    }
    .donation-box li {
      margin-bottom: 8px;
      font-size: 15px;
    }
    .donation-box li:last-child {
      margin-bottom: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Muchas Gracias por tu Donación!</h1>
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
</html>`;

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

Asociación Cooperadora del Hospital Municipal de Necochea`.trim();

  return { htmlContent, textContent };
};

/**
 * Plantilla de Bienvenida a Nuevo Socio
 */
export const renderBienvenidaTemplate = ({ nombre, apellido }) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    ${baseEmailStyle}
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Te damos la bienvenida a la Cooperadora!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${nombre} ${apellido}</strong>,</p>
      <p>Queremos agradecerte por registrarte en el portal de la Asociación Cooperadora del Hospital Municipal de Necochea.</p>
      <div class="welcome-box">
        <p>Tu solicitud de registro ha sido recibida correctamente y se encuentra pendiente de verificación por parte de nuestro equipo administrativo.</p>
      </div>
      <p>Una vez aprobada tu cuenta, podrás ingresar al panel de socios, consultar tu estado de cuotas y gestionar tus aportes solidarios.</p>
      <p>¡Gracias por sumarte y colaborar con la salud pública de nuestra comunidad!</p>
    </div>
    <div class="footer">
      <p>Asociación Cooperadora del Hospital Municipal de Necochea</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `
¡Te damos la bienvenida a la Cooperadora del Hospital!

Hola ${nombre} ${apellido},

Queremos agradecerte por registrarte en el portal de la Asociación Cooperadora del Hospital Municipal de Necochea.

Tu solicitud de registro ha sido recibida correctamente y se encuentra pendiente de verificación por parte de nuestro equipo administrativo.

Una vez aprobada tu cuenta, podrás ingresar al panel de socios, consultar tu estado de cuotas y gestionar tus aportes solidarios.

¡Gracias por sumarte y colaborar con la salud pública de nuestra comunidad!

Asociación Cooperadora del Hospital Municipal de Necochea`.trim();

  return { htmlContent, textContent };
};

/**
 * Plantilla de Recuperación de Contraseña
 */
export const renderRecuperacionTemplate = ({ nombre, resetLink }) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    ${baseEmailStyle}
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn-link {
      background-color: #0d9488;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      display: inline-block;
    }
    .alt-link {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      border: 1px dashed #d1d5db;
      font-size: 13px;
      word-break: break-all;
      color: #4b5563;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Recuperación de Contraseña</h1>
    </div>
    <div class="content">
      <p>Hola, <strong>${nombre}</strong>.</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el portal de la Asociación Cooperadora del Hospital Municipal de Necochea.</p>
      <p>Haz clic en el siguiente botón para crear una nueva clave:</p>
      <div class="btn-container">
        <a href="${resetLink}" class="btn-link" target="_blank">Restablecer mi Contraseña</a>
      </div>
      <p>O copia y pega el siguiente enlace en tu navegador:</p>
      <div class="alt-link">${resetLink}</div>
      <p style="margin-top: 25px; font-size: 14px; color: #6b7280;">Este enlace tiene una validez de <strong>1 hora</strong>. Si no solicitaste este cambio, puedes desestimar este mensaje de forma segura.</p>
    </div>
    <div class="footer">
      <p>Asociación Cooperadora del Hospital Municipal de Necochea</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `
Recupera tu contraseña - Cooperadora Hospital de Necochea

Hola, ${nombre}.

Recibimos una solicitud para restablecer la contraseña de tu cuenta en el portal de la Asociación Cooperadora del Hospital Municipal de Necochea.

Ingresa al siguiente enlace para crear una nueva clave:
${resetLink}

Este enlace tiene una validez de 1 hora. Si no solicitaste este cambio, desestima este mensaje.

Asociación Cooperadora del Hospital Municipal de Necochea`.trim();

  return { htmlContent, textContent };
};

/**
 * Plantilla de Notificación de Aprobación de Socio
 */
export const renderAprobacionSocioTemplate = ({ nombre }) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    ${baseEmailStyle}
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
      <p>A partir de ahora ya puedes acceder a tu panel de socio para ver tu estado de cuotas, declarar transferencias bancarias y gestionar tus aportes.</p>
      <p>Tu participación es fundamental para seguir sosteniendo la salud pública de nuestra ciudad. ¡Muchas gracias por tu compromiso!</p>
    </div>
    <div class="footer">
      <p>Asociación Cooperadora del Hospital Municipal de Necochea</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `
¡Tu cuenta de socio ha sido aprobada! - Cooperadora Hospital de Necochea

Hola, ${nombre}.

Nos alegra informarte que la Comisión Directiva de la Asociación Cooperadora del Hospital Municipal de Necochea ha aprobado tu solicitud de asociación.

Estado de cuenta: ACTIVO (Aprobado)

A partir de ahora ya puedes acceder a tu panel de socio para ver tu estado de cuotas mensuales, declarar tus pagos y gestionar tus aportes.

¡Muchas gracias por tu compromiso!

Asociación Cooperadora del Hospital Municipal de Necochea`.trim();

  return { htmlContent, textContent };
};
