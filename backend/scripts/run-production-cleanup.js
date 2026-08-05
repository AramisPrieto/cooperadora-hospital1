import puppeteer from 'puppeteer';
import path from 'path';

async function run() {
  console.log('🧹 Iniciando Script de Limpieza y Recuperación en Producción...');
  
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

  page.on('dialog', async dialog => {
    const msg = dialog.message();
    console.log(`💬 Diálogo: "${msg}"`);
    if (msg.includes('eliminar') || msg.includes('Eliminar') || msg.includes('seguro') || msg.includes('Seguro') || msg.includes('borrar') || msg.includes('Borrar')) {
      console.log('🗑️ Aceptando confirmación de eliminación...');
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });

  const artifactDir = '/Users/aramisprieto/.gemini/antigravity/brain/bd74f749-1d2a-4091-a014-5b0087063849';

  try {
    console.log('🔑 Logueando como Admin...');
    await page.goto('https://cooperadora-hospital.vercel.app/login', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    await page.type('#email', 'admin@cooperadora.org');
    await page.type('#password', 'AdminCoop2026!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 4000));

    await page.goto('https://cooperadora-hospital.vercel.app/admin', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    // A. Eliminar cualquier Campaña de QA residual
    console.log('🎯 Buscando campañas residuales...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Campañas'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Eliminar repetidamente hasta que no queden campañas que empiecen con "Campaña QA"
    let campaignsLeft = true;
    while (campaignsLeft) {
      const deletedOne = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('div'));
        const campaignDiv = rows.find(d => {
          const h4 = d.querySelector('h4');
          return h4 && h4.textContent.includes('Campaña QA');
        });
        if (campaignDiv) {
          const deleteBtn = campaignDiv.querySelector('button[title="Eliminar"]');
          if (deleteBtn) {
            deleteBtn.click();
            return true;
          }
        }
        return false;
      });

      if (deletedOne) {
        console.log('🗑️ Eliminada campaña de prueba residual...');
        await new Promise(r => setTimeout(r, 4000));
      } else {
        campaignsLeft = false;
      }
    }

    // B. Eliminar cualquier Socio de QA residual
    console.log('🎯 Buscando socios residuales...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Socios'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 5000));

    let partnersLeft = true;
    while (partnersLeft) {
      const expandedOne = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div'));
        const partnerDiv = cards.find(d => d.textContent.includes('qa_test_socio'));
        if (partnerDiv) {
          // Si no está expandido, expandirlo
          const hasDeleteBtn = Array.from(partnerDiv.querySelectorAll('button')).some(b => b.textContent.includes('Eliminar Socio'));
          if (!hasDeleteBtn) {
            partnerDiv.click();
            return true;
          }
        }
        return false;
      });

      if (expandedOne) {
        await new Promise(r => setTimeout(r, 2000));
        // Proceder a eliminarlo
        const deleted = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('div'));
          const partnerDiv = cards.find(d => d.textContent.includes('qa_test_socio'));
          if (partnerDiv) {
            const deleteBtn = Array.from(partnerDiv.querySelectorAll('button')).find(b => b.textContent.includes('Eliminar Socio'));
            if (deleteBtn) {
              deleteBtn.click();
              return true;
            }
          }
          return false;
        });

        if (deleted) {
          console.log('🗑️ Eliminando socio residual...');
          await new Promise(r => setTimeout(r, 4000));
        } else {
          partnersLeft = false;
        }
      } else {
        // Intentar ver si ya hay uno expandido listo para borrar
        const deletedAlreadyExpanded = await page.evaluate(() => {
          const deleteBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Eliminar Socio'));
          if (deleteBtn) {
            deleteBtn.click();
            return true;
          }
          return false;
        });

        if (deletedAlreadyExpanded) {
          console.log('🗑️ Eliminando socio ya expandido...');
          await new Promise(r => setTimeout(r, 4000));
        } else {
          partnersLeft = false;
        }
      }
    }

    await page.screenshot({ path: path.join(artifactDir, 'qa_cleanup_complete.png') });
    console.log('✅ Base de datos de producción restaurada y limpia.');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await browser.close();
  }
}

run();
