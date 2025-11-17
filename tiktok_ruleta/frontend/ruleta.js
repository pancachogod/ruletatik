const WS_URL = 'ws://localhost:3000';

const ruleta = document.getElementById('ruleta');
const resultadoDiv = document.getElementById('resultado');
let opcionesActuales = [];
let anguloActual = 0;

function dibujarRuleta(opciones) {
  ruleta.innerHTML = '';
  const num = opciones.length;
  const anguloSector = 360 / num;
  for (let i = 0; i < num; i++) {
    const sector = document.createElement('div');
    sector.style.position = 'absolute';
    sector.style.width = '50%';
    sector.style.height = '50%';
    sector.style.left = '50%';
    sector.style.top = '50%';
    sector.style.transformOrigin = '0% 0%';
    sector.style.transform = `rotate(${anguloSector * i}deg) skewY(${90 - anguloSector}deg)`;
    sector.style.background = `hsl(${(360 / num) * i},80%,50%)`;
    const label = document.createElement('div');
    label.textContent = opciones[i].nombre;
    label.style.position = 'absolute';
    label.style.top = '50%';
    label.style.left = '10%';
    label.style.transform = `skewY(-${90 - anguloSector}deg)`;
    label.style.fontSize = '14px';
    label.style.whiteSpace = 'nowrap';
    sector.appendChild(label);
    ruleta.appendChild(sector);
  }
}

function girarHastaOpcion(opciones, resultado) {
  const num = opciones.length;
  const index = opciones.findIndex(o => o.nombre === resultado.nombre);
  if (index === -1) return;
  const gradosPorSector = 360 / num;
  const centro = gradosPorSector * index + gradosPorSector / 2;
  const giros = 5;
  const objetivo = 360 * giros + (360 - centro);
  anguloActual += objetivo;
  ruleta.style.transform = `rotate(${anguloActual}deg)`;
  setTimeout(() => resultadoDiv.textContent = "Resultado: " + resultado.nombre, 4000);
}

function conectarWS() {
  const ws = new WebSocket(WS_URL);
  ws.onmessage = msg => {
    const data = JSON.parse(msg.data);
    if (data.tipo === 'LANZAR_RULETA') {
      opcionesActuales = data.opciones;
      dibujarRuleta(opcionesActuales);
      resultadoDiv.textContent = "Regalo de " + data.usuario + ": " + data.regalo;
      setTimeout(() => girarHastaOpcion(opcionesActuales, data.resultado), 500);
    }
  };
  ws.onclose = () => setTimeout(conectarWS, 5000);
}
conectarWS();
