import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

const walkthoughPath = process.env.INPUT || '/Users/aramisprieto/.gemini/antigravity/brain/bd74f749-1d2a-4091-a014-5b0087063849/walkthrough.md';
const outputPath = process.env.OUTPUT || '/Users/aramisprieto/Desktop/Reporte_QA_y_Seguridad.pdf';

async function generatePDF() {
  console.log(`📄 Leyendo el archivo markdown: ${walkthoughPath}`);
  if (!fs.existsSync(walkthoughPath)) {
    console.error('❌ No se encontró el archivo de entrada.');
    process.exit(1);
  }

  const markdownContent = fs.readFileSync(walkthoughPath, 'utf8');

  // 1. Limpiar bloques de carrusel para que marked los procese como Markdown común
  console.log('🧹 Procesando bloques de carrusel...');
  const cleanedMarkdown = markdownContent
    .replace(/````carousel\n([\s\S]*?)````/g, '$1')
    .replace(/```carousel\n([\s\S]*?)```/g, '$1');

  console.log('🔄 Convirtiendo Markdown a HTML...');
  const rawHtml = await marked(cleanedMarkdown);

  // 2. Reemplazar código de mermaid con contenedor compatible y decode de símbolos HTML
  console.log('📐 Configurando diagramas Mermaid...');
  let processedHtml = rawHtml
    .replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      return `<div class="mermaid">${decodedCode}</div>`;
    })
    .replace(/<!-- slide -->/g, '<div class="page-break"></div>');

  // Estilo premium CSS para el reporte PDF
  const styledHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Final Cooperadora</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');
        
        body {
          font-family: 'Outfit', sans-serif;
          color: #1e293b;
          line-height: 1.6;
          max-width: 800px;
          margin: 40px auto;
          padding: 0 20px;
        }

        h1, h2, h3, h4 {
          color: #0f172a;
          font-weight: 800;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }

        h1 {
          font-size: 2.2em;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
          color: #dc2626;
          margin-top: 0;
        }

        h2 {
          font-size: 1.6em;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 5px;
        }

        h3 {
          font-size: 1.2em;
          margin-top: 25px;
        }

        p, li {
          font-size: 14px;
          color: #475569;
        }

        a {
          color: #2563eb;
          text-decoration: none;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 13px;
        }

        th, td {
          border: 1px solid #cbd5e1;
          padding: 10px 12px;
          text-align: left;
        }

        th {
          background-color: #f8fafc;
          color: #0f172a;
          font-weight: 700;
        }

        tr:nth-child(even) {
          background-color: #f8fafc;
        }

        code {
          font-family: 'JetBrains Mono', monospace;
          background-color: #f1f5f9;
          color: #b91c1c;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
        }

        pre {
          background-color: #0f172a;
          color: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          overflow-x: auto;
          margin: 20px 0;
        }

        pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          font-size: 12px;
        }

        img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          margin: 15px 0;
          display: block;
          page-break-inside: avoid;
        }

        .page-break {
          page-break-before: always;
        }

        .mermaid {
          display: flex;
          justify-content: center;
          margin: 25px 0;
          page-break-inside: avoid;
        }

        .mermaid svg {
          max-width: 100% !important;
          height: auto !important;
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
      <script>
        document.addEventListener("DOMContentLoaded", function() {
          mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
        });
      </script>
    </head>
    <body>
      ${processedHtml}
    </body>
    </html>
  `;

  console.log('🚀 Iniciando Puppeteer para renderizar el PDF...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(styledHtml, { waitUntil: 'networkidle2' });

  // Esperar a que todos los diagramas de Mermaid se hayan renderizado
  const hasMermaid = processedHtml.includes('class="mermaid"');
  if (hasMermaid) {
    console.log('⏳ Esperando renderizado de diagramas Mermaid...');
    try {
      await page.waitForFunction(
        () => Array.from(document.querySelectorAll('.mermaid')).every(el => el.getAttribute('data-processed') === 'true'),
        { timeout: 10000 }
      );
      console.log('✅ Diagramas Mermaid renderizados con éxito.');
    } catch (err) {
      console.warn('⚠️ Tiempo de espera agotado para el renderizado de Mermaid.');
    }
  }

  // Esperar un momento adicional para asegurar carga de imágenes locales
  await new Promise(r => setTimeout(r, 2000));

  console.log(`🖨️ Imprimiendo PDF en: ${outputPath}...`);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '20mm',
      right: '20mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="font-size: 9px; text-align: center; width: 100%; font-family: sans-serif; color: #94a3b8; padding-bottom: 5mm;">
        Reporte Oficial Cooperadora - Página <span class="pageNumber"></span> de <span class="totalPages"></span>
      </div>
    `
  });

  await browser.close();
  console.log('✅ PDF generado y guardado con éxito.');
}

generatePDF().catch(err => {
  console.error('❌ Error al generar el PDF:', err);
});
