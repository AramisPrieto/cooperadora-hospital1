import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  const [page] = await browser.pages();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto('https://cooperadora-hospital.vercel.app/login', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.type('#email', 'admin@cooperadora.org');
    await page.type('#password', 'AdminCoop2026!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 4000));

    await page.goto('https://cooperadora-hospital.vercel.app/admin', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const tab = buttons.find(b => b.textContent.includes('Socios'));
      if (tab) tab.click();
    });
    await new Promise(r => setTimeout(r, 5000));

    const texts = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.divide-y > div'));
      return cards.map(c => c.textContent);
    });

    console.log('--- SOCIOS ENCONTRADOS ---');
    console.log(texts);
    console.log('--------------------------');

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

run();
