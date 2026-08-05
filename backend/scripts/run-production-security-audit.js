import fetch from 'node-fetch';
import FormData from 'form-data';

const BACKEND_URL = 'https://cooperadora-backend.onrender.com';
const BYPASS_HEADER = { 'x-qa-bypass': 'cooperadora-qa-bypass-2026' };

async function runAudit() {
  console.log('🛡️ Iniciando Auditoría Dinámica de Ciberseguridad (DAST) en Producción...');
  let testsFailed = 0;

  // ── TEST 1: VERIFICACIÓN DE CORS ───────────────────────────────────────────
  console.log('\n🔍 Test 1: Verificando CORS con origen no autorizado (https://cooperadora-evil.com)...');
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://cooperadora-evil.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type',
        ...BYPASS_HEADER
      }
    });
    
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin === 'https://cooperadora-evil.com') {
      console.error('❌ VULNERABILIDAD CORS DETECTADA: Se permitió el origen malicioso.');
      testsFailed++;
    } else {
      console.log('✅ CORS seguro: El origen no autorizado fue bloqueado o no reflejado en las cabeceras.');
    }
  } catch (err) {
    console.log('✅ CORS seguro: Petición CORS bloqueada a nivel de red/servidor.');
  }

  // Verificando origen legítimo
  console.log('🔍 Verificando CORS con origen autorizado (https://cooperadora-hospital.vercel.app)...');
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://cooperadora-hospital.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type',
        ...BYPASS_HEADER
      }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin === 'https://cooperadora-hospital.vercel.app') {
      console.log('✅ CORS correcto: Origen legítimo permitido.');
    } else {
      console.warn('⚠️ Advertencia: Origen legítimo no reflejado (CORS estricto en API endpoint).');
    }
  } catch (err) {
    console.error('❌ Error al conectar con el servidor:', err.message);
    testsFailed++;
  }

  // REGISTRO DE UN SOCIO TEMPORAL PARA COMPROBAR CONTROLES DE SESIÓN
  const rand = Math.floor(Math.random() * 100000);
  const testEmail = `qa_security_test_${rand}@cooperadora.org`;
  const testDni = `3900${Math.floor(1000 + Math.random() * 9000)}`;
  let token = '';
  let userId = '';

  console.log(`\n📝 Registrando socio temporal para auditoría de privilegios (${testEmail})...`);
  try {
    const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...BYPASS_HEADER },
      body: JSON.stringify({
        email: testEmail,
        password: 'SocioCoop2026!',
        dni: parseInt(testDni),
        nombre: 'QA Security',
        apellido: 'Auditor',
        direccion: 'Calle Falsa 123',
        localidad: 'Necochea',
        nacionalidad: 'Argentina',
        telefono: '2262112233',
        fecha_nacimiento: '1990-05-15',
        genero: 'otro',
        metodo_pago: 'transferencia'
      })
    });
    
    if (regRes.status !== 201) {
      const data = await regRes.json();
      throw new Error(`Registro fallido: ${data.error || regRes.statusText}`);
    }
    console.log('✅ Socio temporal registrado.');

    // Login para obtener token
    const logRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...BYPASS_HEADER },
      body: JSON.stringify({ email: testEmail, password: 'SocioCoop2026!' })
    });
    const logData = await logRes.json();
    token = logRes.headers.get('set-cookie') || logData.token;
    userId = logData.user.id;

    // Si viene en cookies (set-cookie), extraer el token de la cookie
    if (logRes.headers.get('set-cookie')) {
      const cookieStr = logRes.headers.get('set-cookie');
      const match = cookieStr.match(/token=([^;]+)/);
      if (match) token = match[1];
    } else {
      token = logData.token;
    }

    if (!token) {
      throw new Error('No se pudo obtener el token JWT.');
    }
  } catch (err) {
    console.error('❌ Error registrando/logueando socio temporal:', err.message);
    process.exit(1);
  }

  // ── TEST 2: INTENTO DE ESCALACIÓN DE PRIVILEGIOS ───────────────────────────
  console.log('\n🔍 Test 2: Intentando modificar "fecha_ultimo_pago" mediante autogestión de perfil...');
  try {
    const updateRes = await fetch(`${BACKEND_URL}/api/socios/mi-perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...BYPASS_HEADER
      },
      body: JSON.stringify({
        fecha_ultimo_pago: '2099-12-31'
      })
    });

    const data = await updateRes.json();
    if (updateRes.status === 403) {
      console.log(`✅ Escalación bloqueada con éxito (Status 403): "${data.error}"`);
    } else {
      console.error(`❌ VULNERABILIDAD DETECTADA: Se permitió modificar fecha_ultimo_pago (Status ${updateRes.status})`);
      testsFailed++;
    }
  } catch (err) {
    console.error('❌ Error en el test de escalación:', err.message);
    testsFailed++;
  }

  console.log('\n🔍 Test 3: Intentando modificar observaciones administrativas...');
  try {
    const updateRes = await fetch(`${BACKEND_URL}/api/socios/mi-perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...BYPASS_HEADER
      },
      body: JSON.stringify({
        observaciones: 'Modificación maliciosa del socio.'
      })
    });

    const data = await updateRes.json();
    if (updateRes.status === 403) {
      console.log(`✅ Escalación de observaciones bloqueada con éxito (Status 403): "${data.error}"`);
    } else {
      console.error(`❌ VULNERABILIDAD DETECTADA: Se permitió modificar observaciones administrativas (Status ${updateRes.status})`);
      testsFailed++;
    }
  } catch (err) {
    console.error('❌ Error en el test de observaciones:', err.message);
    testsFailed++;
  }

  // ── TEST 4: INTENTO DE BYPASS DE EXTENSIÓN EN SUBIDA DE ARCHIVOS ───────────
  console.log('\n🔍 Test 4: Intentando subir un archivo malicioso HTML camuflado como PNG (Mime Spoofing)...');
  try {
    const form = new FormData();
    form.append('file', Buffer.from('<h1>Malicious Script</h1>'), {
      filename: 'exploit.html',
      contentType: 'image/png'
    });

    const uploadRes = await fetch(`${BACKEND_URL}/api/uploads?tipo=imagen`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders(),
        ...BYPASS_HEADER
      },
      body: form
    });

    const data = await uploadRes.json();
    if (uploadRes.status === 400) {
      console.log(`✅ Subida bloqueada con éxito (Status 400): "${data.error}"`);
    } else {
      console.error(`❌ VULNERABILIDAD DETECTADA: Archivo de extensión peligrosa guardado exitosamente (Status ${uploadRes.status})`);
      console.error('URL generada:', data.url);
      testsFailed++;
    }
  } catch (err) {
    console.error('❌ Error en el test de subida de archivos:', err.message);
    testsFailed++;
  }

  // ── LIMPIEZA POST-AUDITORÍA ────────────────────────────────────────────────
  console.log('\n🧹 Limpiando socio temporal de la base de datos de producción...');
  try {
    // Login como Admin
    const adminLogRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...BYPASS_HEADER },
      body: JSON.stringify({ email: 'admin@cooperadora.org', password: 'AdminCoop2026!' })
    });
    const adminLogData = await adminLogRes.json();
    
    let adminToken = adminLogRes.headers.get('set-cookie') || adminLogData.token;
    if (adminLogRes.headers.get('set-cookie')) {
      const match = adminLogRes.headers.get('set-cookie').match(/token=([^;]+)/);
      if (match) adminToken = match[1];
    } else {
      adminToken = adminLogData.token;
    }

    // Obtener perfil ID del socio para poder borrarlo
    const profileRes = await fetch(`${BACKEND_URL}/api/socios/mi-perfil`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...BYPASS_HEADER
      }
    });
    const profileData = await profileRes.json();
    const socioId = profileData.id;

    // Eliminar socio
    const delRes = await fetch(`${BACKEND_URL}/api/socios/${socioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...BYPASS_HEADER
      }
    });
    if (delRes.status === 200) {
      console.log('✅ Socio temporal eliminado correctamente de producción.');
    } else {
      console.error('❌ Falló la eliminación del socio temporal.');
    }
  } catch (err) {
    console.error('⚠️ Advertencia en la limpieza final:', err.message);
  }

  console.log('\n📊 RESULTADOS DE LA AUDITORÍA DE SEGURIDAD:');
  if (testsFailed === 0) {
    console.log('🏆 100% EXCELENTE. Todos los controles de ciberseguridad están operativos.');
  } else {
    console.error(`💥 SE DETECTARON ${testsFailed} FALLAS DE SEGURIDAD.`);
    process.exit(1);
  }
}

runAudit();
