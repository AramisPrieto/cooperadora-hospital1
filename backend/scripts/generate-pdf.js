import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

const walkthoughPath = '/Users/aramisprieto/.gemini/antigravity/brain/bd74f749-1d2a-4091-a014-5b0087063849/walkthrough.md';
const outputPath = '/Users/aramisprieto/Desktop/Reporte_QA_y_Seguridad.pdf';

async function generatePDF() {
  console.log('📄 Leyendo el archivo de walkthrough...');
  if (!fs.existsSync(walkthoughPath)) {
    console.error('❌ No se encontró el archivo walkthrough.md en la ruta de artefactos.');
    process.exit(1);
  }

  const markdownContent = fs.readFileSync(walkthoughPath, 'utf8');

  console.log('🔄 Convirtiendo Markdown a HTML...');
  const rawHtml = await marked(markdownContent);

  // Estilo premium CSS para el reporte PDF
  const styledHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Final de QA y Ciberseguridad</title>
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

        .page-break {
          page-break-before: always;
        }

        /* Ocultar diagramas mermaid en la impresión del PDF ya que Puppeteer no renderiza los bloques de código mermaid de texto */
        pre:has(code.language-mermaid) {
          display: none;
        }
        
        .mermaid-replacement {
          background-color: #f8fafc;
          border: 1px dashed #cbd5e1;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-style: italic;
          font-size: 13px;
          color: #64748b;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      ${rawHtml.replace(/<pre><code class="language-mermaid">[\s\S]*?<\/code><\/pre>/g, '<div class="mermaid-replacement">Nota: El diagrama de flujo del ciclo E2E se omitió en formato PDF por compatibilidad de renderizado.</div>')}
    </body>
    </html>
  `;

  console.log('🚀 Iniciando Puppeteer para generar el PDF...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(styledHtml, { waitUntil: 'networkidle0' });

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
        Reporte QA y Ciberseguridad - Página <span class="pageNumber"></span> de <span class="totalPages"></span>
      </div>
    `
  });

  await browser.close();
  console.log('✅ PDF generado con éxito.');
}

generatePDF().catch(err => {
  console.error('❌ Error al generar el PDF:', err);
});
