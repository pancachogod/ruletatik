require('dotenv').config();

const http = require('http');
const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');

const FRONTEND_URL = "https://ruletatik-rrv1.vercel.app/"; // ← solo referencia, NO se usa

const PORT = process.env.PORT || 8080;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME;
const REGALO_ACTIVADOR = process.env.REGALO_ACTIVADOR || 'Rose';

const OPCIONES_RULETA = [
  { nombre: 'Reto de baile', probabilidad: 0.5 },
  { nombre: 'Seguir al usuario', probabilidad: 0.3 },
  { nombre: 'Elegir canción', probabilidad: 0.2 }
];

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('TikTok Ruleta Backend OK\n');
});

const wss = new WebSocket.Server({ server });
let clients = [];

wss.on('connection', ws => {
  clients.push(ws);

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

function elegirSegunProbabilidad(opciones) {
  const r = Math.random();
  let acum = 0;

  for (const opc of opciones) {
    acum += opc.probabilidad;
    if (r <= acum) return opc;
  }
  return opciones[opciones.length - 1];
}

function enviarEventoRuleta({ resultado, usuario, regalo }) {
  const payload = JSON.stringify({
    tipo: 'LANZAR_RULETA',
    opciones: OPCIONES_RULEETA,
    resultado,
    usuario,
    regalo
  });

  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

async function iniciarTikTokLive() {
  if (!TIKTOK_USERNAME) {
    console.error("ERROR: No definiste TIKTOK_USERNAME en Railway.");
    return;
  }

  console.log(`Conectando a TikTok Live de @${TIKTOK_USERNAME}...`);

  const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

  try {
    await tiktok.connect();
    console.log("Conectado al live correctamente.");
  } catch (error) {
    console.error("Error conectando al live:", error);
    return;
  }

  tiktok.on("gift", data => {
    const regalo = data?.giftName;
    const usuario = data?.uniqueId;

    console.log(`Regalo recibido: ${regalo} de ${usuario}`);

    if (regalo === REGALO_ACTIVADOR) {
      const resultado = elegirSegunProbabilidad(OPCIONES_RULEETA);
      enviarEventoRuleta({ resultado, usuario, regalo });
    }
  });
}

server.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
  iniciarTikTokLive();
});
