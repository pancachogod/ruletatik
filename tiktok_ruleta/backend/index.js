require('dotenv').config();

const http = require('http');
const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');

const PORT = process.env.PORT || 3000;
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
  ws.on('close', () => clients = clients.filter(c => c !== ws));
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
    opciones: OPCIONES_RULETA,
    resultado,
    usuario,
    regalo
  });
  clients.forEach(ws => ws.readyState === WebSocket.OPEN && ws.send(payload));
}

async function iniciarTikTokLive() {
  if (!TIKTOK_USERNAME) {
    console.error("TIKTOK_USERNAME no definido");
    return;
  }

  const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

  try { await tiktok.connect(); }
  catch(e){ console.error(e); return;}

  tiktok.on('gift', data => {
    const regalo = data?.giftName;
    const usuario = data?.uniqueId;
    if (regalo === REGALO_ACTIVADOR) {
      const resultado = elegirSegunProbabilidad(OPCIONES_RULETA);
      enviarEventoRuleta({ resultado, usuario, regalo });
    }
  });
}

server.listen(PORT, () => {
  iniciarTikTokLive();
});
