import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

let tunnelProcess = null;
let devProcess = null;

// Limpieza al salir
const cleanup = () => {
  console.log('\n🧹 Limpiando procesos de túnel y servidor...');
  if (tunnelProcess) {
    try {
      tunnelProcess.kill('SIGTERM');
    } catch (e) {}
  }
  if (devProcess) {
    try {
      devProcess.kill('SIGTERM');
    } catch (e) {}
  }
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  if (tunnelProcess) tunnelProcess.kill();
  if (devProcess) devProcess.kill();
});

// Detectar el comando ngrok
function getNgrokCommand() {
  if (process.env.NGROK_PATH) {
    if (fs.existsSync(process.env.NGROK_PATH)) return process.env.NGROK_PATH;
  }

  // Probar PATH global
  try {
    const checkCmd = process.platform === 'win32' ? 'where ngrok' : 'which ngrok';
    const pathResult = execSync(checkCmd, { encoding: 'utf8' }).trim();
    if (pathResult) return 'ngrok';
  } catch (err) {}

  // Probar rutas comunes de macOS/Linux
  const commonPaths = [
    '/opt/homebrew/bin/ngrok',
    '/usr/local/bin/ngrok',
    '/usr/bin/ngrok'
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }

  return null;
}

// Actualizar archivo .env
function updateEnvFile(tunnelUrl) {
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const backendUrlLine = `BACKEND_TUNNEL_URL=${tunnelUrl}`;
  if (envContent.includes('BACKEND_TUNNEL_URL=')) {
    envContent = envContent.replace(/BACKEND_TUNNEL_URL=.*/, backendUrlLine);
  } else {
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n';
    }
    envContent += `${backendUrlLine}\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
}

async function startTunnel() {
  const ngrokCmd = getNgrokCommand();

  if (ngrokCmd) {
    console.log(`🚀 ngrok detectado en: "${ngrokCmd}". Iniciando túnel...`);
    tunnelProcess = spawn(ngrokCmd, ['http', '5001'], { stdio: 'ignore' });

    console.log('📡 Esperando a que la API de ngrok responda...');
    const maxAttempts = 15;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        const res = await fetch('http://localhost:4040/api/tunnels');
        if (res.ok) {
          const data = await res.json();
          if (data.tunnels && data.tunnels.length > 0) {
            const httpsTunnel = data.tunnels.find((t) => t.proto === 'https');
            const tunnelUrl = httpsTunnel ? httpsTunnel.public_url : data.tunnels[0].public_url;
            console.log(`✅ ¡Túnel ngrok activo!: ${tunnelUrl}`);
            updateEnvFile(tunnelUrl);
            return tunnelUrl;
          }
        }
      } catch (err) {
        // API no lista todavía
      }
    }
    console.warn('⚠️ No se pudo obtener la URL de la API local de ngrok. Intentando fallback con Pinggy...');
    if (tunnelProcess) {
      tunnelProcess.kill();
      tunnelProcess = null;
    }
  }

  // Fallback con Pinggy usando SSH nativo
  console.log('🚀 Iniciando túnel SSH con Pinggy (a.pinggy.io)...');
  tunnelProcess = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-p', '443',
    '-R', '0:localhost:5001',
    'a.pinggy.io'
  ]);

  return new Promise((resolve, reject) => {
    let urlFound = false;

    const parseOutput = (data) => {
      if (urlFound) return;
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.pinggy-free\.link/);
      if (match) {
        const tunnelUrl = match[0];
        console.log(`✅ ¡Túnel Pinggy (SSH) activo!: ${tunnelUrl}`);
        updateEnvFile(tunnelUrl);
        urlFound = true;
        resolve(tunnelUrl);
      }
    };

    tunnelProcess.stdout.on('data', parseOutput);
    tunnelProcess.stderr.on('data', parseOutput);

    tunnelProcess.on('close', (code) => {
      if (!urlFound) {
        reject(new Error(`El túnel SSH se cerró con código: ${code}`));
      }
    });
  });
}

async function run() {
  try {
    const tunnelUrl = await startTunnel();
    console.log(`🔗 Webhook URL listo en: ${tunnelUrl}/api/webhooks/mercadopago`);
    console.log('🚀 Iniciando servidor backend...');
    
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    devProcess = spawn(command, ['nodemon', 'index.js'], { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error fatal al iniciar el túnel:', error);
    cleanup();
  }
}

run();
