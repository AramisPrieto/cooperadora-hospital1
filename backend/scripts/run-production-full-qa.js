import puppeteer from 'puppeteer';
import path from 'path';

async function run() {
  console.log('🚀 Iniciando testeo completo E2E en Producción (Chrome Visible)...');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const [page] = await browser.pages();
  await page.setViewport({ width: 1280, height: 800 });

  // Interceptar peticiones para inyectar el header x-qa-bypass únicamente en llamadas a la API del backend
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    const headers = { ...request.headers() };
    if (url.includes('/api/')) {
      headers['x-qa-bypass'] = 'cooperadora-qa-bypass-2026';
    }
    request.continue({ headers });
  });

  // Capturar logs y errores de la consola del navegador
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('error') || text.includes('failed') || text.includes('Fail') || text.includes('401') || text.includes('403') || text.includes('500')) {
      console.log(`🖥️ BROWSER CONSOLE: ${text}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`🚨 BROWSER PAGE ERROR: ${err.message}`);
  });

  // Manejo de diálogos
  page.on('dialog', async dialog => {
    const msg = dialog.message();
    console.log(`💬 Diálogo capturado: "${msg}"`);
    if (msg.includes('eliminar') || msg.includes('Eliminar') || msg.includes('seguro') || msg.includes('Seguro') || msg.includes('borrar') || msg.includes('Borrar')) {
      console.log('🗑️ Confirmando eliminación/acción en el diálogo...');
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });

  const artifactDir = '/Users/aramisprieto/.gemini/antigravity/brain/bd74f749-1d2a-4091-a014-5b0087063849';
  const dummyFilePath = '/Users/aramisprieto/Documents/cooperadora-hospital1/etapas-teoria/gestion-desarrollo-software/der.png';

  const randId = Math.floor(Math.random() * 10000);
  const socioEmail = `qa_test_socio_${randId}@cooperadora.org`;
  const socioDni = `3500${Math.floor(1000 + Math.random() * 9000)}`;
  const campaignWithImgTitle = `Campaña QA Con Imagen #${randId}`;
  const campaignWithoutImgTitle = `Campaña QA Sin Imagen #${randId}`;

  try {
    // 1. REGISTRO DE NUEVO SOCIO
    console.log('➕ Navegando al Login/Registro para registrar un socio...');
    await page.goto('https://cooperadora-hospital.vercel.app/login', { waitUntil: 'networkidle2' });
    
    console.log('⌛ Esperando formulario de Login...');
    await page.waitForSelector('#email', { timeout: 10000 });

    console.log('🔘 Cambiando a la pestaña "Registrarse"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const regTab = buttons.find(b => b.textContent.includes('Registrarse'));
      if (regTab) regTab.click();
    });
    
    console.log('⌛ Esperando formulario de Registro...');
    await page.waitForSelector('#nombre', { timeout: 5000 });

    console.log(`📝 Completando formulario de registro para ${socioEmail}...`);
    await page.type('#email', socioEmail);
    await page.type('#password', 'SocioCoop2026!');
    await page.type('#dni', socioDni);
    await page.type('#nombre', 'QA Socio');
    await page.type('#apellido', 'Automated');
    await page.type('#telefono', '2262551122');
    await page.type('#direccion', 'Calle 50 1234');
    await page.select('#genero', 'masculino');
    await page.select('#metodoPago', 'transferencia');

    // Limpiar y configurar nacionalidad, localidad y fechaNacimiento de forma segura bypassando setters de React
    await page.evaluate(() => {
      const nacInput = document.getElementById('nacionalidad');
      const locInput = document.getElementById('localidad');
      const dateInput = document.getElementById('fechaNacimiento');

      const setReactValue = (input, value) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };

      setReactValue(nacInput, 'Argentina');
      setReactValue(locInput, 'Necochea');
      setReactValue(dateInput, '1995-10-12');
    });

    await page.click('#acceptTerms');

    await page.screenshot({ path: path.join(artifactDir, 'qa_1_registro_completo.png') });
    console.log('🔘 Enviando formulario de registro...');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 6000));
    await page.screenshot({ path: path.join(artifactDir, 'qa_2_registro_resultado.png') });

    // Limpiar sesión del socio recién registrado (ya que se auto-loguea)
    console.log('🔘 Cerrando sesión del socio registrado para poder ingresar como admin...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('https://cooperadora-hospital.vercel.app/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#email', { timeout: 8000 });

    // 2. INGRESO COMO ADMIN PARA APROBAR AL SOCIO Y CREAR CAMPAÑAS
    console.log('🔑 Iniciando sesión como Administrador...');
    
    // Asegurarse de que esté la pestaña "Ingresar" activa
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginTab = buttons.find(b => b.textContent.includes('Ingresar'));
      if (loginTab) loginTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.type('#email', 'admin@cooperadora.org');
    await page.type('#password', 'AdminCoop2026!');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 5000));
    console.log('👤 Admin redirigido.');

    // Ir a sección de administración
    await page.goto('https://cooperadora-hospital.vercel.app/admin', { waitUntil: 'networkidle2' });
    console.log('⌛ Esperando carga del Admin Panel...');
    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));

    // A. Aprobar el nuevo Socio
    console.log('🎯 Yendo a la pestaña Socios para aprobar el perfil...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Socios'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 4000));

    console.log(`🔍 Buscando y aprobando socio: ${socioEmail}...`);
    await page.evaluate((email) => {
      const cards = Array.from(document.querySelectorAll('div'));
      const partnerDiv = cards.find(d => d.textContent.includes(email));
      if (partnerDiv) {
        const approveBtn = Array.from(partnerDiv.querySelectorAll('button')).find(b => b.textContent.includes('Aprobar'));
        if (approveBtn) approveBtn.click();
      }
    }, socioEmail);
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: path.join(artifactDir, 'qa_3_socio_aprobado.png') });

    // B. Crear Campaña con Imagen
    console.log('🎯 Yendo a la pestaña Campañas...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Campañas'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('➕ Creando Campaña con Imagen...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Nueva'));
      if (btn) btn.click();
    });
    
    console.log('⌛ Esperando formulario de campaña...');
    await page.waitForSelector('#titulo', { timeout: 8000 });

    await page.type('#titulo', campaignWithImgTitle);
    await page.type('#monto_objetivo', '250000');
    await page.type('#testimoniosText', 'Test integral E2E con imagen.');
    await page.type('#testimoniosAutor', 'Comisión Directiva QA');
    await page.type('#equipamiento_info', 'Ecógrafo portátil de alta resolución para emergencias.');
    
    console.log('🖼️ Subiendo imágenes en el formulario...');
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length >= 2) {
      await fileInputs[0].uploadFile(dummyFilePath);
      await new Promise(r => setTimeout(r, 3000));
      await fileInputs[1].uploadFile(dummyFilePath);
      await new Promise(r => setTimeout(r, 3000));
    }
    await page.screenshot({ path: path.join(artifactDir, 'qa_4_form_campana_con_imagen.png') });
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 4000));

    // C. Crear Campaña sin Imagen (Tolerancia a Nulos)
    console.log('➕ Creando Campaña sin Imagen...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Nueva'));
      if (btn) btn.click();
    });
    
    console.log('⌛ Esperando formulario de campaña...');
    await page.waitForSelector('#titulo', { timeout: 8000 });

    await page.type('#titulo', campaignWithoutImgTitle);
    await page.type('#monto_objetivo', '100000');
    await page.type('#testimoniosText', 'Test integral E2E tolerante a campos nulos.');
    await page.type('#testimoniosAutor', 'QA Tester');
    await page.type('#equipamiento_info', 'Kit básico de camillas clínicas sin ilustración.');
    await page.screenshot({ path: path.join(artifactDir, 'qa_5_form_campana_sin_imagen.png') });
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 4000));

    // D. Cerrar sesión y forzar reinicio de estado SPA
    console.log('🔘 Cerrando sesión del administrador y recargando página...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('https://cooperadora-hospital.vercel.app/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#email', { timeout: 5000 });

    // 3. INGRESO COMO EL NUEVO SOCIO APROBADO PARA DECLARAR PAGOS Y DONACIONES
    console.log('🔑 Iniciando sesión como el Socio Aprobado...');
    await page.type('#email', socioEmail);
    await page.type('#password', 'SocioCoop2026!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 5000));
    console.log('👤 Socio autenticado.');
    
    await page.goto('https://cooperadora-hospital.vercel.app/mi-panel', { waitUntil: 'networkidle2' });
    console.log('⌛ Esperando carga del Socio Dashboard (/mi-panel)...');
    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(artifactDir, 'qa_6_socio_dashboard.png') });

    // Cambiar a pestaña "Mis Cuotas"
    console.log('🎯 Activando la pestaña "Mis Cuotas"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Mis Cuotas'));
      if (tab) tab.click();
    });
    
    console.log('⌛ Esperando inputs de declaración de cuota...');
    await page.waitForSelector('input[placeholder="2000"]', { timeout: 8000 });

    // A. Declarar pago de cuota
    console.log('💵 Declarando pago de cuota por transferencia...');
    await page.type('input[placeholder="2000"]', '2500');
    await page.type('input[placeholder="Ej: TXN-54321"]', 'TXN-QA-CUOTA');
    const transferFileInputs = await page.$$('input[type="file"]');
    if (transferFileInputs.length > 0) {
      await transferFileInputs[0].uploadFile(dummyFilePath);
      await new Promise(r => setTimeout(r, 3000));
    }
    await page.screenshot({ path: path.join(artifactDir, 'qa_7_socio_cuota_declared_form.png') });
    
    console.log('🔘 Enviando declaración de cuota...');
    await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const cuotaForm = forms.find(f => f.textContent.includes('Declarar Transferencia de Cuota'));
      if (cuotaForm) {
        const btn = cuotaForm.querySelector('button[type="submit"]');
        if (btn) btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 4500));
    await page.screenshot({ path: path.join(artifactDir, 'qa_8_socio_cuota_declared_success.png') });

    // B. Declarar donación a la nueva campaña creada
    console.log('🧭 Navegando a la sección de campañas...');
    await page.goto('https://cooperadora-hospital.vercel.app/campanas', { waitUntil: 'networkidle2' });
    console.log('⌛ Esperando renderizado de la lista de campañas...');
    await page.waitForSelector('a, h3, h4', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log(`🔍 Esperando que aparezca la campaña "${campaignWithImgTitle}" en el listado...`);
    await page.waitForFunction((title) => {
      const headings = Array.from(document.querySelectorAll('h3'));
      return headings.some(h => h.textContent.includes(title));
    }, { timeout: 10000 }, campaignWithImgTitle);

    console.log(`🔍 Abriendo campaña con imagen: "${campaignWithImgTitle}"...`);
    // Usar el selector xpath nativo de Puppeteer
    const h3Selector = `xpath///h3[contains(text(), "${campaignWithImgTitle}")]`;
    const headingHandle = await page.waitForSelector(h3Selector, { timeout: 8000 });
    await headingHandle.click();
    
    console.log('⌛ Esperando detalle de la campaña...');
    await page.waitForSelector('button', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(artifactDir, 'qa_9_socio_campaign_detail.png') });

    console.log('🔘 Abriendo modal de donación...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const donateBtn = buttons.find(b => b.textContent.includes('Donar a esta campaña'));
      if (donateBtn) donateBtn.click();
    });

    console.log('⌛ Esperando inputs de donación...');
    await page.waitForSelector('input[placeholder="5000"]', { timeout: 8000 });

    console.log('❤️ Declarando donación de 5000 por transferencia...');
    await page.type('input[placeholder="5000"]', '5000');
    await page.type('input[placeholder="TXN-1234567"]', 'TXN-QA-DONATION');
    const donationFileInputs = await page.$$('input[type="file"]');
    if (donationFileInputs.length > 0) {
      await donationFileInputs[0].uploadFile(dummyFilePath);
      await new Promise(r => setTimeout(r, 3000));
    }
    await page.screenshot({ path: path.join(artifactDir, 'qa_10_socio_donation_form_filled.png') });

    console.log('🔘 Enviando donación...');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 4500));
    await page.screenshot({ path: path.join(artifactDir, 'qa_11_socio_donation_success.png') });

    // C. Cerrar sesión y forzar reinicio de estado SPA
    console.log('🔘 Cerrando sesión del socio y recargando página...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('https://cooperadora-hospital.vercel.app/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#email', { timeout: 5000 });

    // 4. INGRESO COMO ADMIN PARA APROBAR TRANSFERENCIAS Y LUEGO LIMPIAR TODO
    console.log('🔑 Re-ingresando como Administrador para aprobaciones y limpieza...');
    await page.type('#email', 'admin@cooperadora.org');
    await page.type('#password', 'AdminCoop2026!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 5000));
    
    await page.goto('https://cooperadora-hospital.vercel.app/admin', { waitUntil: 'networkidle2' });
    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));

    // A. Aprobar Transferencia de Donación
    console.log('🎯 Yendo a la pestaña Transferencias...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Transferencias'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    console.log('🔍 Buscando y aprobando donación TXN-QA-DONATION...');
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const targetRow = rows.find(r => r.textContent.includes('TXN-QA-DONATION'));
      if (targetRow) {
        const approveBtn = Array.from(targetRow.querySelectorAll('button')).find(b => b.textContent.includes('Aprobar'));
        if (approveBtn) approveBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 4500));
    await page.screenshot({ path: path.join(artifactDir, 'qa_12_admin_donation_approved.png') });

    // B. Aprobar Pago de Cuota
    console.log('🎯 Yendo a la pestaña Cuotas Sociales...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Cuotas Sociales'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    console.log('🔍 Buscando y aprobando cuota del socio...');
    await page.evaluate((dni) => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const targetRow = rows.find(r => r.textContent.includes(dni));
      if (targetRow) {
        const approveBtn = Array.from(targetRow.querySelectorAll('button')).find(b => b.textContent.includes('Aprobar'));
        if (approveBtn) approveBtn.click();
      }
    }, socioDni);
    await new Promise(r => setTimeout(r, 4500));
    await page.screenshot({ path: path.join(artifactDir, 'qa_13_admin_cuota_approved.png') });

    // C. LIMPIEZA TOTAL EN PRODUCCIÓN (Campañas y Socio)
    console.log('🧹 Iniciando eliminación de datos de prueba para restaurar el estado original...');
    
    // 1. Eliminar Campañas
    console.log('🎯 Yendo a la pestaña Campañas...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Campañas'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    console.log(`🗑️ Eliminando campaña: "${campaignWithImgTitle}"...`);
    await page.evaluate((title) => {
      const rows = Array.from(document.querySelectorAll('div'));
      const campaignDiv = rows.find(d => {
        const h4 = d.querySelector('h4');
        return h4 && h4.textContent.includes(title);
      });
      if (campaignDiv) {
        const deleteBtn = campaignDiv.querySelector('button[title="Eliminar"]');
        if (deleteBtn) deleteBtn.click();
      }
    }, campaignWithImgTitle);
    await new Promise(r => setTimeout(r, 4000));

    console.log(`🗑️ Eliminando campaña: "${campaignWithoutImgTitle}"...`);
    await page.evaluate((title) => {
      const rows = Array.from(document.querySelectorAll('div'));
      const campaignDiv = rows.find(d => {
        const h4 = d.querySelector('h4');
        return h4 && h4.textContent.includes(title);
      });
      if (campaignDiv) {
        const deleteBtn = campaignDiv.querySelector('button[title="Eliminar"]');
        if (deleteBtn) deleteBtn.click();
      }
    }, campaignWithoutImgTitle);
    await new Promise(r => setTimeout(r, 4000));

    // 2. Eliminar Socio
    console.log('🎯 Yendo a la pestaña Socios...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Socios'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 4000));

    console.log(`🗑️ Expandiendo y eliminando socio: "${socioEmail}"...`);
    await page.evaluate((email) => {
      const cards = Array.from(document.querySelectorAll('.divide-y > div'));
      const partnerDiv = cards.find(d => d.textContent.includes(email));
      if (partnerDiv) {
        partnerDiv.click();
      }
    }, socioEmail);
    await new Promise(r => setTimeout(r, 2000));

    await page.evaluate((email) => {
      const cards = Array.from(document.querySelectorAll('.divide-y > div'));
      const partnerDiv = cards.find(d => d.textContent.includes(email));
      if (partnerDiv) {
        const deleteBtn = Array.from(partnerDiv.querySelectorAll('button')).find(b => b.textContent.includes('Eliminar Socio'));
        if (deleteBtn) deleteBtn.click();
      }
    }, socioEmail);
    await new Promise(r => setTimeout(r, 4000));

    await page.screenshot({ path: path.join(artifactDir, 'qa_14_admin_cleaned_state.png') });
    console.log('✅ Prueba integral E2E y limpieza finalizadas con éxito.');

  } catch (err) {
    console.error('❌ Error crítico en ejecución QA E2E:', err);
  } finally {
    await browser.close();
  }
}

run();
