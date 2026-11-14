// Arma la maqueta del fondo (vista desde arriba) para una ventana de ancho x alto.
// Todo se ubica afuera de la columna del contenido, así nada queda detrás de una publicación:
//  - dos vías verticales a los costados de la columna (las curvas que las unen quedan fuera de la pantalla);
//  - la estación junto a la vía derecha, un río más afuera a la derecha, un camino y casas a la izquierda;
//  - árboles al azar (con semilla fija: la maqueta sale siempre igual) en lo que queda libre.

// Ancho de la columna del contenido: tiene que coincidir con .contenido en styles.css
export const ANCHO_CONTENIDO = 800;

const MARGEN_COLUMNA = 16; // aire entre la columna y lo que hay en el fondo
const DISTANCIA_VIA = 58; // de la columna al eje de cada vía
const ESPACIO_PARA_VIAS = DISTANCIA_VIA + 30; // si a los costados no hay al menos esto, no hay vías
const ALTO_BARRA = 64; // la barra de navegación tapa esa franja de arriba
const VELOCIDAD_TREN = 55; // px por segundo

export interface Arbol {
  x: number;
  y: number;
  r: number;
  color: string;
}

export interface Casa {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  techo: string;
  techoSombra: string;
  giro: number;
}

export interface EscenaMaqueta {
  ancho: number;
  alto: number;
  via: { d: string; duracion: number } | null;
  anden: { x: number; y: number; ancho: number; alto: number } | null; // el edificio va con las casas
  rio: string | null;
  camino: string | null;
  casas: Casa[];
  arboles: Arbol[];
}

interface Zona {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

// Azar con semilla (siempre los mismos números): así la maqueta no cambia cada vez que se abre
function azar(semilla: number) {
  let s = semilla;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function casa(x: number, y: number, ancho: number, alto: number, techo: string, giro: number): Casa {
  return { x, y, ancho, alto, techo, techoSombra: oscurecer(techo), giro };
}

// El techo es a dos aguas: un lado se ve más oscuro
function oscurecer(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * 0.78);
  return `rgb(${f(n >> 16)} ${f((n >> 8) & 255)} ${f(n & 255)})`;
}

// Curva vertical suave que baja por la pantalla, oscilando alrededor de x
function curvaVertical(x: number, alto: number, amplitud: number): string {
  return (
    `M${x} -20 ` +
    `C${x + amplitud} ${alto * 0.2}, ${x - amplitud} ${alto * 0.4}, ${x} ${alto * 0.55} ` +
    `S${x + amplitud} ${alto * 0.9}, ${x} ${alto + 20}`
  );
}

function dentro(x: number, y: number, z: Zona): boolean {
  return x > z.x && x < z.x + z.ancho && y > z.y && y < z.y + z.alto;
}

export function armarEscena(ancho: number, alto: number): EscenaMaqueta {
  const rnd = azar(42);
  const columnaIzq = Math.max(0, (ancho - ANCHO_CONTENIDO) / 2);
  const columnaDer = ancho - columnaIzq;
  const costado = columnaIzq; // ancho libre a cada lado

  // Zonas donde no puede ir nada: la columna del contenido (con aire) y la barra de arriba
  const prohibidas: Zona[] = [
    { x: columnaIzq - MARGEN_COLUMNA, y: -50, ancho: columnaDer - columnaIzq + 2 * MARGEN_COLUMNA, alto: alto + 100 },
    { x: -50, y: -50, ancho: ancho + 100, alto: ALTO_BARRA + 50 },
  ];
  // Lugares "angostos" a evitar: el río y el camino, como franjas verticales
  const franjas: { x: number; mitad: number }[] = [];

  let via: EscenaMaqueta['via'] = null;
  let anden: EscenaMaqueta['anden'] = null;
  let rio: string | null = null;
  let camino: string | null = null;
  const casas: Casa[] = [];

  if (costado >= ESPACIO_PARA_VIAS) {
    const xIzq = columnaIzq - DISTANCIA_VIA;
    const xDer = columnaDer + DISTANCIA_VIA;
    // Vuelta completa: baja por la derecha, cruza abajo (fuera de la pantalla), sube por la izquierda y
    // cruza arriba (detrás de la barra). Así el tren nunca pasa por detrás del contenido.
    via = {
      d: `M${xDer} -80 V${alto + 80} H${xIzq} V-80 Z`,
      duracion: Math.round((2 * (alto + 160) + 2 * (xDer - xIzq)) / VELOCIDAD_TREN),
    };
    franjas.push({ x: xIzq, mitad: 20 }, { x: xDer, mitad: 20 });

    // Estación del lado de afuera de la vía derecha, en el primer tercio de la pantalla
    const yEstacion = Math.max(ALTO_BARRA + 30, alto * 0.28);
    anden = { x: xDer + 14, y: yEstacion, ancho: 12, alto: 120 };
    casas.push(casa(xDer + 30, yEstacion + 25, 58, 32, '#a63d2f', 90)); // el edificio de la estación
    prohibidas.push({ x: xDer + 10, y: yEstacion - 10, ancho: 80, alto: 145 });

    // Río afuera de la vía derecha, si hay lugar
    const afueraDer = ancho - (xDer + 20);
    if (afueraDer > 160) {
      const xRio = xDer + 20 + afueraDer * 0.6;
      rio = curvaVertical(xRio, alto, 30);
      franjas.push({ x: xRio, mitad: 50 });
    }

    // Camino de tierra y casas afuera de la vía izquierda, si hay lugar
    const afueraIzq = xIzq - 20;
    if (afueraIzq > 160) {
      const xCamino = afueraIzq * 0.45;
      camino = curvaVertical(xCamino, alto, 22);
      franjas.push({ x: xCamino, mitad: 34 });
      const colores = ['#b8862b', '#a63d2f', '#7a2e22'];
      [0.22, 0.3, 0.5, 0.58, 0.8].forEach((f, i) => {
        const lado = i % 2 === 0 ? 1 : -1;
        const x = xCamino + lado * 34 - (lado < 0 ? 32 : 0);
        const y = Math.max(ALTO_BARRA + 10, alto * f);
        const c = casa(x, y, 32, 22, colores[i % colores.length], (rnd() - 0.5) * 24);
        casas.push(c);
        prohibidas.push({ x: x - 8, y: y - 8, ancho: 48, alto: 38 });
      });
    }
  }

  // Árboles en lo que queda libre de los costados (más cantidad cuanto más espacio hay)
  const arboles: Arbol[] = [];
  const intentos = Math.min(600, Math.round((2 * costado * alto) / 450));
  for (let i = 0; i < intentos; i++) {
    const enDerecha = rnd() > 0.5;
    const x = (enDerecha ? columnaDer : 0) + rnd() * costado;
    const y = rnd() * alto;
    const r = 6 + rnd() * 9;
    const color = rnd() > 0.5 ? '#3f6b3a' : '#4d7a40';
    if (prohibidas.some((z) => dentro(x, y, z))) continue;
    if (franjas.some((f) => Math.abs(x - f.x) < f.mitad + r)) continue;
    arboles.push({ x, y, r, color });
  }

  return { ancho, alto, via, anden, rio, camino, casas, arboles };
}
