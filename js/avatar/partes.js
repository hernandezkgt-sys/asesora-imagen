// Piezas del avatar: curvas, colores, rostro y cabello.
// Todo devuelve texto SVG o "caminos" (el atributo d de un <path>).

// ---------- Herramientas de dibujo ----------

const redondear = (n) => Math.round(n * 10) / 10;

// Une una lista de puntos [x, y] con una curva suave y cerrada (Catmull-Rom).
export function curvaCerrada(puntos) {
  const n = puntos.length;
  let d = `M${redondear(puntos[0][0])},${redondear(puntos[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = puntos[(i - 1 + n) % n];
    const p1 = puntos[i];
    const p2 = puntos[(i + 1) % n];
    const p3 = puntos[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${redondear(c1x)},${redondear(c1y)} ${redondear(c2x)},${redondear(c2y)} ${redondear(p2[0])},${redondear(p2[1])}`;
  }
  return d + 'Z';
}

// Recibe la mitad derecha de una figura ([distancia al centro, y]) y la
// completa con su reflejo para formar la figura entera.
// Los puntos que caen justo en el centro (distancia 0) no se repiten.
export function simetrico(derecha, cx) {
  const lado = derecha.map(([dx, y]) => [cx + dx, y]);
  const reflejo = derecha
    .slice()
    .reverse()
    .filter(([dx]) => dx !== 0)
    .map(([dx, y]) => [cx - dx, y]);
  return [...lado, ...reflejo];
}

// ---------- Colores ----------

function hexARgb(hex) {
  const limpio = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(limpio.slice(i, i + 2), 16));
}

export function mezclar(colorA, colorB, cantidad) {
  const a = hexARgb(colorA);
  const b = hexARgb(colorB);
  const mezcla = a.map((v, i) => Math.round(v + (b[i] - v) * cantidad));
  return '#' + mezcla.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export const oscurecer = (color, cantidad) => mezclar(color, '#2B1A1F', cantidad);
export const aclarar = (color, cantidad) => mezclar(color, '#FFFFFF', cantidad);

// ---------- Rostro ----------

// Cada forma: qué tan ancha es (respecto a lo alto) y su contorno derecho,
// de la coronilla (0, -1) a la barbilla (0, 1).
export const FORMAS_ROSTRO = {
  ovalado: {
    ancho: 0.76,
    contorno: [[0, -1], [0.62, -0.9], [0.93, -0.5], [1, 0], [0.92, 0.42], [0.68, 0.78], [0.32, 0.97], [0, 1]],
  },
  redondo: {
    ancho: 0.84,
    contorno: [[0, -1], [0.68, -0.88], [0.97, -0.45], [1.02, 0.05], [0.96, 0.5], [0.74, 0.84], [0.38, 0.99], [0, 1.01]],
  },
  cuadrado: {
    ancho: 0.8,
    contorno: [[0, -1], [0.74, -0.92], [0.95, -0.52], [0.97, 0], [0.96, 0.45], [0.88, 0.8], [0.5, 0.98], [0, 1]],
  },
  corazon: {
    ancho: 0.79,
    contorno: [[0, -1], [0.72, -0.9], [1, -0.45], [0.98, 0], [0.8, 0.45], [0.5, 0.8], [0.18, 0.98], [0, 1]],
  },
  alargado: {
    ancho: 0.67,
    contorno: [[0, -1], [0.66, -0.9], [0.94, -0.48], [0.98, 0], [0.94, 0.46], [0.72, 0.82], [0.32, 0.98], [0, 1]],
  },
  diamante: {
    ancho: 0.76,
    contorno: [[0, -1], [0.48, -0.9], [0.8, -0.5], [1, -0.04], [0.84, 0.42], [0.54, 0.78], [0.2, 0.98], [0, 1]],
  },
};

export function formaRostro(id) {
  return FORMAS_ROSTRO[id] ?? FORMAS_ROSTRO.ovalado;
}

export function caminoRostro(id, cx, cy, rx, ry) {
  const puntos = formaRostro(id).contorno.map(([x, y]) => [x * rx, cy + y * ry]);
  return curvaCerrada(simetrico(puntos, cx));
}

// Ojos, cejas, nariz, labios y rubor, en estilo ilustración minimalista.
export function rasgosCara({ cx, cy, rx, ry, piel, cabello }) {
  const tinta = '#3A262D';
  const ceja = oscurecer(cabello, 0.2);
  const labios = mezclar(piel, '#C2506E', 0.6);
  const linea = oscurecer(piel, 0.3);
  const ojoY = cy + 0.08 * ry;
  let svg = '';

  for (const lado of [-1, 1]) {
    const ex = cx + lado * 0.38 * rx;
    // Rubor
    svg += `<ellipse cx="${redondear(cx + lado * 0.55 * rx)}" cy="${redondear(cy + 0.38 * ry)}" rx="${redondear(0.2 * rx)}" ry="${redondear(0.1 * ry)}" fill="#F0879F" opacity="0.3"/>`;
    // Ceja
    svg += `<path d="M${redondear(ex - lado * 0.14 * rx)},${redondear(ojoY - 0.24 * ry)} Q${redondear(ex + lado * 0.02 * rx)},${redondear(ojoY - 0.35 * ry)} ${redondear(ex + lado * 0.2 * rx)},${redondear(ojoY - 0.27 * ry)}" fill="none" stroke="${ceja}" stroke-width="${redondear(0.06 * rx)}" stroke-linecap="round"/>`;
    // Ojo
    svg += `<ellipse cx="${redondear(ex)}" cy="${redondear(ojoY)}" rx="${redondear(0.075 * rx)}" ry="${redondear(0.085 * ry)}" fill="${tinta}"/>`;
    svg += `<circle cx="${redondear(ex + 0.025 * rx)}" cy="${redondear(ojoY - 0.03 * ry)}" r="${redondear(0.022 * rx)}" fill="#fff"/>`;
    // Pestañas: línea sobre el ojo con un pequeño rizo hacia afuera
    const inicioX = ex - lado * 0.13 * rx;
    const finX = ex + lado * 0.14 * rx;
    svg += `<path d="M${redondear(inicioX)},${redondear(ojoY - 0.02 * ry)} Q${redondear(ex)},${redondear(ojoY - 0.17 * ry)} ${redondear(finX)},${redondear(ojoY - 0.05 * ry)} l${redondear(lado * 0.06 * rx)},${redondear(-0.05 * ry)}" fill="none" stroke="${tinta}" stroke-width="${redondear(0.045 * rx)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  // Nariz
  svg += `<path d="M${redondear(cx + 0.02 * rx)},${redondear(cy + 0.2 * ry)} q${redondear(0.07 * rx)},${redondear(0.13 * ry)} ${redondear(-0.05 * rx)},${redondear(0.17 * ry)}" fill="none" stroke="${linea}" stroke-width="${redondear(0.04 * rx)}" stroke-linecap="round"/>`;

  // Labios
  const ly = cy + 0.56 * ry;
  svg += `<path d="M${redondear(cx - 0.2 * rx)},${redondear(ly)} Q${redondear(cx - 0.1 * rx)},${redondear(ly - 0.09 * ry)} ${redondear(cx)},${redondear(ly - 0.03 * ry)} Q${redondear(cx + 0.1 * rx)},${redondear(ly - 0.09 * ry)} ${redondear(cx + 0.2 * rx)},${redondear(ly)} Q${redondear(cx)},${redondear(ly + 0.14 * ry)} ${redondear(cx - 0.2 * rx)},${redondear(ly)}Z" fill="${labios}"/>`;

  return svg;
}

// ---------- Cabello ----------

// Hasta dónde llega el cabello por detrás y qué tan ancho cae al final.
function finCabello(largo, m) {
  const { cabeza, nivelY } = m;
  const barbilla = cabeza.cy + cabeza.ry;
  switch (largo) {
    case 'corto': return { y: cabeza.cy + 0.35 * cabeza.ry, ancho: 1.08 * cabeza.rx };
    case 'barbilla': return { y: barbilla + 0.1 * cabeza.ry, ancho: 1.22 * cabeza.rx };
    case 'media': return { y: nivelY(0.21), ancho: 1.5 * cabeza.rx };
    case 'largo': return { y: nivelY(0.31), ancho: 1.45 * cabeza.rx };
    default: return { y: nivelY(0.09), ancho: 1.45 * cabeza.rx }; // hombros
  }
}

// La parte del cabello que queda detrás de la cabeza y el cuerpo.
export function caminoCabelloAtras(largo, m) {
  const { cx, cy, rx, ry } = m.cabeza;
  const fin = finCabello(largo, m);
  const puntos = [
    [0, cy - 1.12 * ry],
    [0.8 * rx, cy - 1.02 * ry],
    [1.12 * rx, cy - 0.55 * ry],
    [1.18 * rx, cy],
  ];
  if (fin.y > cy + ry) {
    const medio = (cy + fin.y) / 2;
    puntos.push([(1.18 * rx + fin.ancho) / 2 + 0.04 * rx, medio]);
  }
  puntos.push(
    [fin.ancho, fin.y - 0.15 * ry],
    [fin.ancho * 0.82, fin.y],
    [fin.ancho * 0.35, fin.y - 0.05 * ry],
    [0, fin.y - 0.2 * ry],
  );
  return curvaCerrada(simetrico(puntos, cx));
}

// El flequillo y la parte de arriba, que van encima de la frente.
export function caminoCabelloFrente(largo, m) {
  const { cx, cy, rx, ry } = m.cabeza;
  // Con cabello largo, los lados bajan más y tapan las orejas.
  const sien = largo === 'corto' ? cy - 0.05 * ry : cy + 0.3 * ry;
  const puntos = [
    [cx + 1.04 * rx, sien],
    [cx + 1.09 * rx, cy - 0.5 * ry],
    [cx + 0.76 * rx, cy - 0.97 * ry],
    [cx, cy - 1.11 * ry],
    [cx - 0.76 * rx, cy - 0.97 * ry],
    [cx - 1.09 * rx, cy - 0.5 * ry],
    [cx - 1.04 * rx, sien],
    [cx - 0.92 * rx, cy - 0.28 * ry],
    [cx - 0.55 * rx, cy - 0.6 * ry],
    [cx - 0.1 * rx, cy - 0.6 * ry],
    [cx + 0.25 * rx, cy - 0.78 * ry],
    [cx + 0.7 * rx, cy - 0.6 * ry],
    [cx + 0.95 * rx, cy - 0.25 * ry],
  ];
  return curvaCerrada(puntos);
}

// Un brillo suave para que el cabello no se vea plano.
export function brilloCabello(m) {
  const { cx, cy, rx, ry } = m.cabeza;
  return `M${redondear(cx - 0.5 * rx)},${redondear(cy - 0.86 * ry)} Q${redondear(cx)},${redondear(cy - 1.02 * ry)} ${redondear(cx + 0.45 * rx)},${redondear(cy - 0.9 * ry)}`;
}
