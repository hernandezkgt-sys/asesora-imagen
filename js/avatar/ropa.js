// Dibuja la ropa sobre el avatar a partir de los datos de cada prenda
// (color, estampado, cuello, manga, largo, ajuste, tiro…).
// Las posiciones se escriben como [distancia al centro, nivel], donde el
// nivel va de 0 (barbilla) a 1 (suelo), igual que en dibujar-avatar.js.
import { curvaCerrada, simetrico, oscurecer, aclarar, mezclar } from './partes.js';
import { categoria, color } from '../closet/catalogo.js';

const r1 = (n) => Math.round(n * 10) / 10;
const poligono = (puntos) => 'M' + puntos.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' L') + 'Z';
const limitar = (n, min, max) => Math.min(max, Math.max(min, n));

// Convierte [distancia, nivel] de la mitad derecha en la figura completa.
const completar = (m, mitad) => simetrico(mitad.map(([x, nivel]) => [x, m.nivelY(nivel)]), m.cx);

function interpolar(tabla, nivel) {
  if (nivel <= tabla[0][0]) return tabla[0][1];
  for (let i = 1; i < tabla.length; i++) {
    const [n1, v1] = tabla[i];
    if (nivel <= n1) {
      const [n0, v0] = tabla[i - 1];
      return v0 + ((v1 - v0) * (nivel - n0)) / (n1 - n0);
    }
  }
  return tabla[tabla.length - 1][1];
}

// ---------- Medidas del cuerpo a cualquier altura ----------

function anchoCuerpo(m, nivel) {
  const { ancho: a, pierna: { fuera: f } } = m;
  return interpolar([
    [0.035, a.cuello * 1.15], [0.075, a.hombro], [0.13, a.axila], [0.165, a.busto],
    [0.21, a.bajoBusto], [0.29, a.cintura], [0.36, a.caderaAlta], [0.425, a.cadera],
    [0.5, f.muslo], [0.59, f.musloMedio], [0.68, f.rodilla], [0.77, f.pantorrilla],
    [0.955, f.tobillo], [1, f.pie],
  ], nivel);
}

function pierna(m, nivel) {
  const niveles = [0.5, 0.59, 0.68, 0.77, 0.955, 1];
  const claves = ['muslo', 'musloMedio', 'rodilla', 'pantorrilla', 'tobillo', 'pie'];
  const fuera = interpolar(niveles.map((n, i) => [n, m.pierna.fuera[claves[i]]]), nivel);
  const dentro = interpolar(niveles.map((n, i) => [n, m.pierna.dentro[claves[i]]]), nivel);
  return { fuera, dentro, centro: (fuera + dentro) / 2, medio: (fuera - dentro) / 2 };
}

// Centro y medio grosor del brazo derecho a cierta altura.
function brazo(m, nivel) {
  const centro = interpolar([[0.085, m.hombroX], [0.29, m.codoX], [0.45, m.munecaX]], nivel);
  const medio = interpolar([
    [0.085, m.grosor.brazo / 2], [0.17, m.grosor.brazo / 2],
    [0.29, m.grosor.codo / 2], [0.45, m.grosor.muneca / 2],
  ], nivel);
  return { centro, medio };
}

// Nivel de la línea del hombro a cierta distancia del centro.
function lineaHombro(m, x) {
  const inicio = m.ancho.cuello * 1.15;
  return 0.035 + limitar((x - inicio) / (m.ancho.hombro - inicio), 0, 1) * 0.04;
}

function niveles(desde, hasta, paso = 0.015) {
  const lista = [];
  for (let n = desde; n < hasta; n += paso) lista.push(n);
  lista.push(hasta);
  return lista;
}

// ---------- Colores y estampados ----------

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const ARCOIRIS = ['#E87FA4', '#F2CF45', '#2F8A57', '#2F62C2', '#6A3D8F'];

// Devuelve con qué rellenar la prenda: color liso o un estampado.
function pintura(prenda, idPatron) {
  const c = color(prenda.color);
  const base = c?.hex ?? '#D8CFD3';
  const borde = oscurecer(base, 0.32);
  const estampado = c?.id === 'multicolor' && (!prenda.estampado || prenda.estampado === 'liso')
    ? 'multicolor'
    : prenda.estampado;
  if (!estampado || estampado === 'liso') return { relleno: base, borde, defs: '', base };

  const contraste = luminancia(base) > 0.55 ? oscurecer(base, 0.45) : aclarar(base, 0.7);
  const fondo = `<rect width="12" height="12" fill="${base}"/>`;
  let tam = 6;
  let dibujo = '';
  switch (estampado) {
    case 'rayas-horizontales': dibujo = `<rect width="6" height="2" fill="${contraste}"/>`; break;
    case 'rayas-verticales': dibujo = `<rect width="2" height="6" fill="${contraste}"/>`; break;
    case 'cuadros':
      tam = 7;
      dibujo = `<rect width="7" height="2.4" fill="${contraste}" opacity="0.55"/><rect width="2.4" height="7" fill="${contraste}" opacity="0.55"/>`;
      break;
    case 'lunares':
      dibujo = `<circle cx="1.5" cy="1.5" r="0.9" fill="${contraste}"/><circle cx="4.5" cy="4.5" r="0.9" fill="${contraste}"/>`;
      break;
    case 'flores':
      tam = 9;
      dibujo = [0, 72, 144, 216, 288].map((g) => {
        const rad = (g * Math.PI) / 180;
        return `<circle cx="${r1(4.5 + Math.cos(rad) * 1.4)}" cy="${r1(4.5 + Math.sin(rad) * 1.4)}" r="0.9" fill="${contraste}"/>`;
      }).join('') + `<circle cx="4.5" cy="4.5" r="0.7" fill="${mezclar(base, '#F2CF45', 0.7)}"/>`;
      break;
    case 'animal':
      tam = 10;
      dibujo = `<path d="M2 2c1.5-1 3 0 2.5 1.5S2 5 2 2zM7 6c1.2-.8 2.6.3 2 1.4S6.5 8 7 6zM3 7.5c1-.4 1.8.5 1.2 1.2S2.4 8.2 3 7.5z" fill="${oscurecer(base, 0.55)}"/>`;
      break;
    case 'geometrico':
      dibujo = `<path d="M0 6L3 1L6 6Z" fill="${contraste}" opacity="0.7"/>`;
      break;
    case 'multicolor':
      tam = 10;
      dibujo = ARCOIRIS.map((c2, i) => `<rect y="${i * 2}" width="10" height="2" fill="${c2}"/>`).join('');
      break;
    default:
      dibujo = `<path d="M0 6L6 0" stroke="${contraste}" stroke-width="1"/>`;
  }
  const defs = `<pattern id="${idPatron}" width="${tam}" height="${tam}" patternUnits="userSpaceOnUse">${fondo}${dibujo}</pattern>`;
  return { relleno: `url(#${idPatron})`, borde, defs, base };
}

const trazo = (d, p, extra = '') =>
  `<path d="${d}" fill="${p.relleno}" stroke="${p.borde}" stroke-width="0.8" stroke-linejoin="round" ${extra}/>`;

// ---------- Escotes ----------

const HOLGURA = { pegado: 0.03, recto: 0.07, suelto: 0.13, oversize: 0.2 };

// Mitad derecha del escote, del centro hacia el hombro.
function escote(m, cuello) {
  const nw = m.ancho.cuello * 1.3;
  const curva = (ancho, profundidad, partes = 6) => Array.from({ length: partes + 1 }, (_, i) => {
    const t = ((i / partes) * Math.PI) / 2;
    const x = ancho * Math.sin(t);
    return [x, profundidad + (lineaHombro(m, x) - profundidad) * (1 - Math.cos(t))];
  });
  const recta = (profundidad, ancho) => [[0, profundidad], [ancho, lineaHombro(m, ancho)]];

  switch (cuello) {
    case 'v': return { puntos: recta(0.15, nw * 1.15), hombros: true };
    case 'cruzado': return { puntos: recta(0.18, nw * 1.2), hombros: true };
    case 'amplio': return { puntos: curva(nw * 1.6, 0.1), hombros: true };
    case 'cuadrado': {
      const x = nw * 1.35;
      return { puntos: [[0, 0.11], [x, 0.11], [x, lineaHombro(m, x)]], hombros: true };
    }
    case 'barco': return { puntos: curva(m.ancho.hombro * 0.72, 0.05), hombros: true };
    case 'camisero': return { puntos: recta(0.09, nw * 1.05), hombros: true, solapas: true };
    case 'alto': {
      const x = m.ancho.cuello * 1.08;
      return { puntos: [[0, 0.004], [x, 0.004], [x * 1.08, 0.035]], hombros: true };
    }
    case 'halter':
      return { puntos: [[0, 0.1], [m.ancho.cuello * 0.9, 0.0], [m.ancho.cuello * 1.3, 0.006]], tipo: 'halter' };
    case 'sin-tirantes': return { puntos: [[0, 0.135]], tipo: 'recto', inicio: 0.135 };
    case 'hombros-descubiertos': return { puntos: [[0, 0.105]], tipo: 'recto', inicio: 0.105, sobreHombros: true };
    default: return { puntos: curva(nw, 0.065), hombros: true };
  }
}

// ---------- Tops, vestidos y capas ----------

// Ancho del torso de una prenda según su ajuste.
function anchoSuperior(m, nivel, ajuste, extra = 0) {
  const h = ((HOLGURA[ajuste] ?? HOLGURA.recto) + extra) * m.u;
  const cuerpo = anchoCuerpo(m, nivel) + h;
  if (nivel <= 0.165) {
    return ajuste === 'oversize' && nivel <= 0.1 ? cuerpo + 0.06 * m.u : cuerpo;
  }
  const busto = m.ancho.busto + h;
  switch (ajuste) {
    case 'pegado': return cuerpo;
    case 'suelto': return Math.max(cuerpo, busto + (nivel - 0.165) * 0.5 * m.u);
    case 'oversize': return Math.max(cuerpo, Math.max(busto, m.ancho.hombro + h * 0.4) + (nivel - 0.165) * 0.3 * m.u);
    default: return Math.max(cuerpo, busto * 0.95);
  }
}

// Contorno del torso de un top o vestido.
// "anchoEn" da el ancho a cada nivel; "dobladillo" describe el borde de abajo.
function contornoTorso(m, prenda, anchoEn, dobladillo) {
  const esc = escote(m, prenda.cuello);
  const mitad = [...esc.puntos];
  let inicioLados = 0.1;

  if (esc.tipo === 'recto') {
    const x = esc.sobreHombros ? m.ancho.hombro + 0.12 * m.u : anchoEn(esc.inicio);
    mitad.push([x, esc.inicio]);
    inicioLados = esc.inicio + 0.02;
  } else if (esc.tipo === 'halter') {
    mitad.push([m.ancho.axila * 0.88, 0.14]);
    inicioLados = 0.16;
  } else if (prenda.manga === 'tirantes') {
    const x = esc.puntos.at(-1)[0] + 0.22 * m.u;
    mitad.push([x, lineaHombro(m, x)], [m.ancho.axila * 0.9, 0.14]);
    inicioLados = 0.16;
  } else {
    mitad.push([anchoEn(0.075), 0.075]);
  }

  for (const nivel of niveles(inicioLados, dobladillo.lados)) mitad.push([anchoEn(nivel), nivel]);
  mitad.push(...dobladillo.centro);
  return { d: poligono(completar(m, mitad)), escote: esc };
}

// Dobladillo normal (recto) o fajado al frente (centro metido, lados sueltos).
function dobladillo(m, anchoEn, largo, fajar, tiro) {
  if (fajar === 'frente' && largo > tiro + 0.04) {
    const lados = Math.min(largo, tiro + 0.075);
    return {
      lados,
      centro: [[anchoEn(lados) * 0.55, lados - 0.012], [0.3 * m.u, tiro + 0.028], [0, tiro + 0.016]],
    };
  }
  return { lados: largo, centro: [[0, largo]] };
}

function solapasCamisa(m, p) {
  const nw = m.ancho.cuello * 1.3;
  const mitad = [[0.04 * m.u, 0.09], [nw * 1.12, lineaHombro(m, nw * 1.12) - 0.006], [nw * 1.55, 0.072]];
  const d = [1, -1].map((lado) => poligono(mitad.map(([x, n]) => [m.cx + lado * x, m.nivelY(n)]))).join(' ');
  return `<path d="${d}" fill="${aclarar(p.base, 0.15)}" stroke="${p.borde}" stroke-width="0.7" stroke-linejoin="round"/>`;
}

const FIN_MANGA = { corta: 0.17, 'tres-cuartos': 0.37, larga: 0.455, abullonada: 0.16 };
const FIN_MANGA_DOBLADA = { 'tres-cuartos': 0.31, larga: 0.35 };

// Una manga (lado 1 = derecha, -1 = izquierda), dibujada encima del brazo.
function manga(m, lado, { tipo, holgura, inicio, doblada }) {
  const fin = (doblada && FIN_MANGA_DOBLADA[tipo]) || FIN_MANGA[tipo];
  if (!fin) return '';
  const h = holgura * m.u;
  const abullonada = tipo === 'abullonada';
  const mitad = inicio
    ? [[m.hombroX - m.grosor.brazo / 2 - h, inicio], [m.ancho.hombro + 0.06 * m.u + h, inicio]]
    : [[m.hombroX - 0.12 * m.u, 0.06], [m.ancho.hombro - 0.03 * m.u + h * 0.5, 0.07], [m.ancho.hombro + 0.05 * m.u + h + (abullonada ? 0.1 * m.u : 0), 0.1]];
  const recorrido = niveles(0.13, fin, 0.03);
  for (const nivel of recorrido) {
    const b = brazo(m, nivel);
    const inflado = abullonada ? 0.1 * m.u * (1 - (nivel - 0.13) / 0.04) : 0;
    mitad.push([b.centro + b.medio + h + Math.max(0, inflado), nivel]);
  }
  for (const nivel of recorrido.slice().reverse()) {
    const b = brazo(m, nivel);
    mitad.push([b.centro - b.medio - h, nivel]);
  }
  mitad.push([m.hombroX - m.grosor.brazo / 2 - h, 0.12]);
  const puntos = mitad.map(([x, n]) => [m.cx + lado * x, m.nivelY(n)]);
  return curvaCerrada(puntos);
}

// Banda del puño cuando la manga va doblada.
function punoDoblado(m, lado, tipo, holgura) {
  const fin = FIN_MANGA_DOBLADA[tipo];
  if (!fin) return '';
  const h = (holgura + 0.03) * m.u;
  const arriba = brazo(m, fin - 0.025);
  const abajo = brazo(m, fin);
  const mitad = [
    [arriba.centro + arriba.medio + h, fin - 0.025], [abajo.centro + abajo.medio + h, fin],
    [abajo.centro - abajo.medio - h, fin], [arriba.centro - arriba.medio - h, fin - 0.025],
  ];
  return poligono(mitad.map(([x, n]) => [m.cx + lado * x, m.nivelY(n)]));
}

function mangas(m, prenda, p, { holgura, doblada }) {
  const esc = escote(m, prenda.cuello);
  const tipo = prenda.manga ?? (categoria(prenda.categoria)?.grupo === 'capas' ? 'larga' : 'corta');
  if (!FIN_MANGA[tipo] || esc.tipo === 'halter' || prenda.cuello === 'sin-tirantes') return '';
  const inicio = esc.sobreHombros ? esc.inicio : null;
  let svg = '';
  for (const lado of [1, -1]) {
    svg += trazo(manga(m, lado, { tipo, holgura, inicio, doblada }), p);
    if (doblada) svg += trazo(punoDoblado(m, lado, tipo, holgura), { ...p, relleno: aclarar(p.base, 0.12) });
  }
  return svg;
}

const LARGO_TOP = { crop: 0.23, cintura: 0.3, cadera: 0.41, muslo: 0.55 };
const LARGO_CAPA = { crop: 0.25, cintura: 0.31, cadera: 0.43, muslo: 0.56, rodilla: 0.69, largo: 0.86 };
const LARGO_FALDA = { mini: 0.53, rodilla: 0.68, midi: 0.8, largo: 0.95 };
const LARGO_PANTALON = { capri: 0.8, tobillo: 0.94, largo: 0.99 };
const LARGO_SHORT = { mini: 0.52, medio: 0.57, bermuda: 0.66 };
const TIRO = { alto: 0.29, medio: 0.335, bajo: 0.375 };

function top(m, prenda, p, { fajar, tiro }) {
  const ajuste = prenda.ajuste ?? 'recto';
  const anchoEn = (nivel) => anchoSuperior(m, nivel, ajuste);
  let largo = LARGO_TOP[prenda.largo] ?? 0.41;
  if (fajar === 'completa') largo = Math.min(largo, tiro + 0.02);
  const { d, escote: esc } = contornoTorso(m, prenda, anchoEn, dobladillo(m, anchoEn, largo, fajar, tiro));
  let svg = trazo(d, p);
  if (esc.solapas) svg += solapasCamisa(m, p);
  return svg;
}

function vestido(m, prenda, p) {
  const ajuste = prenda.ajuste ?? 'recto';
  const largo = LARGO_FALDA[prenda.largo] ?? 0.68;
  const anchoEn = (nivel) => (nivel <= 0.29 ? anchoSuperior(m, nivel, ajuste === 'oversize' ? 'suelto' : ajuste) : anchoFalda(m, nivel, ajuste, 0.29));
  const { d, escote: esc } = contornoTorso(m, prenda, anchoEn, { lados: largo, centro: [[0, largo]] });
  let svg = trazo(d, p);
  if (esc.solapas) svg += solapasCamisa(m, p);
  return svg;
}

// Chaqueta, blazer o cárdigan: dos paneles (izquierdo y derecho).
// "debajo" es el ajuste del top que lleva abajo, para que la capa lo cubra.
function capa(m, prenda, p, { abierta, debajo }) {
  const ajuste = prenda.ajuste === 'pegado' ? 'recto' : prenda.ajuste ?? 'recto';
  const anchoEn = (nivel) => Math.max(
    anchoSuperior(m, nivel, ajuste, 0.05),
    debajo ? anchoSuperior(m, nivel, debajo, 0.04) : 0,
  );
  const largo = LARGO_CAPA[prenda.largo] ?? 0.43;
  const cuello = m.ancho.cuello * 1.35;
  const cierre = prenda.categoria === 'cardigan' ? 0.17 : 0.21;
  // Distancia del borde del panel al centro a cada altura.
  const borde = (nivel) => {
    if (abierta) return cuello + (0.3 * m.u - cuello) * limitar((nivel - 0.03) / 0.2, 0, 1);
    return nivel < cierre ? cuello * (1 - (nivel - 0.03) / (cierre - 0.03)) : -0.02 * m.u;
  };
  const exterior = [[cuello, 0.03], [anchoEn(0.075), 0.075]];
  for (const nivel of niveles(0.1, largo)) exterior.push([anchoEn(nivel), nivel]);
  const interior = niveles(0.03, largo).reverse().map((nivel) => [borde(nivel), nivel]);
  const mitad = [...exterior, ...interior];

  let svg = '';
  for (const lado of [1, -1]) {
    const puntos = mitad.map(([x, n]) => [m.cx + lado * x, m.nivelY(n)]);
    svg += trazo(poligono(puntos), p);
  }
  // Solapas del blazer y la chaqueta
  if (prenda.categoria !== 'cardigan') {
    const solapa = [[cuello, 0.03], [cuello + 0.3 * m.u, 0.085], [Math.max(borde(0.19), 0) + 0.05 * m.u, 0.19]];
    for (const lado of [1, -1]) {
      const puntos = solapa.map(([x, n]) => [m.cx + lado * x, m.nivelY(n)]);
      svg += `<path d="${poligono(puntos)}" fill="${oscurecer(p.base, 0.12)}" stroke="${p.borde}" stroke-width="0.7" stroke-linejoin="round"/>`;
    }
  }
  if (!abierta) {
    for (const nivel of [cierre + 0.02, cierre + 0.08].filter((n) => n < largo - 0.02)) {
      svg += `<circle cx="${m.cx}" cy="${r1(m.nivelY(nivel))}" r="${r1(0.045 * m.u)}" fill="${oscurecer(p.base, 0.4)}"/>`;
    }
  }
  return svg;
}

// ---------- Pantalones, shorts y faldas ----------

function anchoFalda(m, nivel, ajuste, desde) {
  const h = (HOLGURA[ajuste] ?? HOLGURA.recto) * m.u;
  const cuerpo = anchoCuerpo(m, Math.min(nivel, 0.425)) + h;
  if (nivel <= desde) return anchoCuerpo(m, nivel) + h;
  switch (ajuste) {
    case 'pegado':
      return nivel <= 0.425 ? cuerpo : (m.ancho.cadera + h) * (1 - (nivel - 0.425) * 0.4);
    case 'suelto':
    case 'oversize': {
      const abre = ajuste === 'oversize' ? 1.3 : 0.9;
      const inicio = anchoCuerpo(m, desde) + h;
      return Math.max(cuerpo, inicio + (nivel - desde) * abre * m.u * 2);
    }
    default:
      return nivel <= 0.425 ? cuerpo : m.ancho.cadera + h;
  }
}

function falda(m, prenda, p, tiro) {
  const ajuste = prenda.ajuste ?? 'recto';
  const largo = LARGO_FALDA[prenda.largo] ?? 0.68;
  const mitad = niveles(tiro, largo).map((nivel) => [anchoFalda(m, nivel, ajuste, tiro), nivel]);
  mitad.push([0, largo]);
  return trazo(poligono(completar(m, [[0, tiro], ...mitad])), p) + pretina(m, tiro, p, ajuste);
}

// Medio ancho de la pierna del pantalón según su corte.
function piernaPantalon(m, nivel, corte, h) {
  const base = pierna(m, nivel);
  const ajustada = base.medio + h;
  switch (corte) {
    case 'entubado': return ajustada;
    case 'amplio': return Math.max(ajustada, pierna(m, 0.5).medio * 0.92 + h + (nivel - 0.5) * 0.25 * m.u);
    case 'acampanado': return nivel < 0.68 ? ajustada : ajustada + ((nivel - 0.68) / 0.32) * 0.32 * m.u;
    case 'holgado': return ajustada + 0.08 * m.u;
    default: return Math.max(ajustada, pierna(m, 0.62).medio + h);
  }
}

function pantalon(m, prenda, p, tiro) {
  const esShort = prenda.categoria === 'short';
  const largo = esShort ? LARGO_SHORT[prenda.largo] ?? 0.55 : LARGO_PANTALON[prenda.largo] ?? 0.97;
  const ajuste = prenda.ajuste ?? 'recto';
  const corte = esShort ? (ajuste === 'pegado' ? 'entubado' : 'amplio') : prenda.pierna ?? (ajuste === 'pegado' ? 'entubado' : 'recto');
  const h = (HOLGURA[ajuste] ?? HOLGURA.recto) * m.u * 0.6;

  const fuera = [];
  const dentro = [];
  for (const nivel of niveles(tiro, 0.475)) fuera.push([anchoCuerpo(m, nivel) + h, nivel]);
  for (const nivel of niveles(0.5, largo)) {
    const centro = pierna(m, nivel).centro;
    const medio = piernaPantalon(m, nivel, corte, h);
    fuera.push([centro + medio, nivel]);
    dentro.push([Math.max(0.012 * m.u, centro - medio), nivel]);
  }
  const mitad = [[0, tiro], ...fuera, ...dentro.reverse(), [0, 0.485]];
  return trazo(poligono(completar(m, mitad)), p) + pretina(m, tiro, p, ajuste);
}

function pretina(m, tiro, p, ajuste) {
  const h = (HOLGURA[ajuste] ?? HOLGURA.recto) * m.u * 0.6;
  const ancho = anchoCuerpo(m, tiro + 0.012) + h;
  const y = m.nivelY(tiro + 0.014);
  return `<path d="M${r1(m.cx - ancho)},${r1(y)} L${r1(m.cx + ancho)},${r1(y)}" stroke="${p.borde}" stroke-width="0.6" opacity="0.7"/>`;
}

// ---------- Zapatos ----------

function zapatos(m, prenda) {
  const base = color(prenda.color)?.hex ?? '#3A2A2F';
  const borde = oscurecer(base, 0.35);
  const tipo = prenda.tipoZapato ?? 'flats';
  const suelo = m.nivelY(1);
  let svg = '';

  for (const lado of [1, -1]) {
    const pie = pierna(m, 1);
    const x0 = pie.dentro - 0.03 * m.u;
    const x1 = pie.fuera + 0.03 * m.u;
    const X = (x) => m.cx + lado * x;
    const punta = tipo === 'tacones' ? 0.035 * m.u : 0;

    if (tipo === 'botines' || tipo === 'botas') {
      const arriba = tipo === 'botas' ? 0.72 : 0.9;
      const mitad = [];
      for (const nivel of niveles(arriba, 0.985, 0.02)) {
        const pp = pierna(m, nivel);
        mitad.push([pp.fuera + 0.04 * m.u, nivel]);
      }
      mitad.push([x1 + 0.01 * m.u, 1], [x0 - 0.01 * m.u, 1]);
      for (const nivel of niveles(arriba, 0.985, 0.02).reverse()) {
        const pp = pierna(m, nivel);
        mitad.push([pp.dentro - 0.04 * m.u, nivel]);
      }
      svg += `<path d="${curvaCerrada(mitad.map(([x, n]) => [X(x), m.nivelY(n)]))}" fill="${base}" stroke="${borde}" stroke-width="0.8"/>`;
      continue;
    }

    if (tipo === 'sandalias') {
      for (const nivel of [0.968, 0.988]) {
        const y = m.nivelY(nivel);
        svg += `<path d="M${r1(X(x0 + 0.02 * m.u))},${r1(y)} L${r1(X(x1 - 0.02 * m.u))},${r1(y)}" stroke="${base}" stroke-width="${r1(0.06 * m.u)}" stroke-linecap="round"/>`;
      }
      svg += `<path d="M${r1(X(x0))},${r1(suelo + 0.6)} L${r1(X(x1))},${r1(suelo + 0.6)}" stroke="${borde}" stroke-width="1.2" stroke-linecap="round"/>`;
      continue;
    }

    const arriba = m.nivelY(tipo === 'tenis' ? 0.962 : 0.976);
    const forma = [
      [X(x0 + 0.02 * m.u), arriba], [X(x1 - 0.01 * m.u), arriba],
      [X(x1 + 0.01 * m.u), suelo - 1], [X((x0 + x1) / 2 + lado * 0), suelo + 1.2 + punta],
      [X(x0 - 0.01 * m.u), suelo - 1],
    ];
    svg += `<path d="${curvaCerrada(forma)}" fill="${base}" stroke="${borde}" stroke-width="0.8"/>`;
    if (tipo === 'tenis' || tipo === 'plataformas') {
      const grosor = tipo === 'plataformas' ? 2.6 : 1.6;
      const suela = tipo === 'tenis' ? '#FAFAF7' : oscurecer(base, 0.25);
      svg += `<rect x="${r1(Math.min(X(x0), X(x1)) - 0.5)}" y="${r1(suelo - grosor + 1)}" width="${r1(x1 - x0 + 1)}" height="${grosor}" rx="0.8" fill="${suela}" stroke="${borde}" stroke-width="0.5"/>`;
    }
  }
  return svg;
}

// ---------- Accesorios ----------

function accesorio(m, prenda, cinturaY) {
  const base = color(prenda.color)?.hex ?? '#C9A54A';
  const borde = oscurecer(base, 0.35);
  const { cx, u } = m;
  const Y = (n) => r1(m.nivelY(n));
  const { cy, rx, ry } = m.cabeza;

  if (prenda.categoria === 'bolsa') {
    const tam = { pequena: 0.5, mediana: 0.7, grande: 0.95 }[prenda.tamano] ?? 0.7;
    const ancho = tam * u;
    const alto = tam * u * 0.8;
    const x = cx - (m.munecaX + 0.25 * u) - ancho / 2;
    const y = m.nivelY(0.4);
    return `<path d="M${r1(cx + m.ancho.cuello * 1.6)},${Y(0.05)} L${r1(x + ancho / 2)},${r1(y)}" stroke="${borde}" stroke-width="0.9" fill="none"/>`
      + `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(ancho)}" height="${r1(alto)}" rx="${r1(0.08 * u)}" fill="${base}" stroke="${borde}" stroke-width="0.8"/>`;
  }

  switch (prenda.tipoAccesorio) {
    case 'collar-corto': {
      const ancho = m.ancho.cuello * 1.35;
      return `<path d="M${r1(cx - ancho)},${Y(0.03)} Q${cx},${Y(0.085)} ${r1(cx + ancho)},${Y(0.03)}" fill="none" stroke="${base}" stroke-width="1.1"/>`;
    }
    case 'collar-largo': {
      const ancho = m.ancho.cuello * 1.25;
      return `<path d="M${r1(cx - ancho)},${Y(0.025)} Q${r1(cx - ancho * 0.6)},${Y(0.2)} ${cx},${Y(0.22)} Q${r1(cx + ancho * 0.6)},${Y(0.2)} ${r1(cx + ancho)},${Y(0.025)}" fill="none" stroke="${base}" stroke-width="0.9"/>`
        + `<circle cx="${cx}" cy="${r1(m.nivelY(0.22) + 2)}" r="${r1(0.06 * u)}" fill="${base}" stroke="${borde}" stroke-width="0.5"/>`;
    }
    case 'cinturon': {
      const ancho = anchoCuerpo(m, cinturaY) + 0.1 * u;
      const y = m.nivelY(cinturaY) - 0.025 * u;
      const alto = 0.1 * u;
      return `<rect x="${r1(cx - ancho)}" y="${r1(y)}" width="${r1(ancho * 2)}" height="${r1(alto)}" fill="${base}" stroke="${borde}" stroke-width="0.6"/>`
        + `<rect x="${r1(cx - alto * 0.8)}" y="${r1(y - alto * 0.15)}" width="${r1(alto * 1.6)}" height="${r1(alto * 1.3)}" rx="0.6" fill="none" stroke="#C9A54A" stroke-width="0.9"/>`;
    }
    case 'bufanda': {
      const ancho = m.ancho.cuello * 1.6;
      return `<path d="M${r1(cx - ancho)},${Y(0.01)} Q${cx},${Y(0.08)} ${r1(cx + ancho)},${Y(0.01)} L${r1(cx + ancho * 0.9)},${Y(0.27)} L${r1(cx + ancho * 0.35)},${Y(0.27)} L${r1(cx + ancho * 0.4)},${Y(0.07)} Q${cx},${Y(0.1)} ${r1(cx - ancho * 0.8)},${Y(0.05)}Z" fill="${base}" stroke="${borde}" stroke-width="0.8" stroke-linejoin="round"/>`;
    }
    case 'aretes':
      return [-1, 1].map((lado) => `<circle cx="${r1(cx + lado * rx * 1.02)}" cy="${r1(cy + 0.3 * ry)}" r="${r1(0.09 * rx)}" fill="${base}" stroke="${borde}" stroke-width="0.4"/>`).join('');
    case 'lentes': {
      const ojoY = cy + 0.08 * ry;
      return [-1, 1].map((lado) => `<rect x="${r1(cx + lado * 0.38 * rx - 0.2 * rx)}" y="${r1(ojoY - 0.13 * ry)}" width="${r1(0.4 * rx)}" height="${r1(0.26 * ry)}" rx="${r1(0.08 * rx)}" fill="${base}" fill-opacity="0.25" stroke="${borde}" stroke-width="0.8"/>`).join('')
        + `<path d="M${r1(cx - 0.18 * rx)},${r1(ojoY - 0.04 * ry)} L${r1(cx + 0.18 * rx)},${r1(ojoY - 0.04 * ry)}" stroke="${borde}" stroke-width="0.8"/>`;
    }
    case 'sombrero': {
      const arriba = cy - 1.05 * ry;
      return `<ellipse cx="${cx}" cy="${r1(arriba + 0.3 * ry)}" rx="${r1(rx * 1.9)}" ry="${r1(ry * 0.22)}" fill="${base}" stroke="${borde}" stroke-width="0.8"/>`
        + `<path d="M${r1(cx - rx * 0.95)},${r1(arriba + 0.3 * ry)} Q${r1(cx - rx)},${r1(arriba - 0.5 * ry)} ${cx},${r1(arriba - 0.5 * ry)} Q${r1(cx + rx)},${r1(arriba - 0.5 * ry)} ${r1(cx + rx * 0.95)},${r1(arriba + 0.3 * ry)}Z" fill="${base}" stroke="${borde}" stroke-width="0.8"/>`;
    }
    case 'pulsera': {
      const b = brazo(m, 0.44);
      return `<rect x="${r1(cx + b.centro - b.medio - 0.5)}" y="${Y(0.435)}" width="${r1(b.medio * 2 + 1)}" height="${r1(0.06 * u)}" rx="0.6" fill="${base}" stroke="${borde}" stroke-width="0.4"/>`;
    }
    default:
      return '';
  }
}

const EN_CABEZA = ['aretes', 'lentes', 'sombrero'];

// ---------- Todo junto ----------

// Recibe las prendas del outfit y devuelve el SVG separado por capas:
// "cuerpo" va antes de los brazos, "mangas" después, y "cabeza" al final.
export function vestir(m, outfit = {}, id = 'avatar') {
  const { top: prendaTop, abajo, capa: prendaCapa, zapatos: prendaZapatos, accesorios = [], estilo = {} } = outfit;
  const defs = [];
  const cuerpo = [];
  const brazos = [];
  const cabeza = [];
  let contador = 0;
  const pinta = (prenda) => {
    const p = pintura(prenda, `${id}-patron-${contador++}`);
    if (p.defs) defs.push(p.defs);
    return p;
  };

  const esVestido = abajo?.categoria === 'vestido';
  const esFalda = abajo?.categoria === 'falda';
  const tiro = abajo && !esVestido ? TIRO[abajo.tiro] ?? (esFalda ? TIRO.alto : TIRO.medio) : 0.3;
  const fajar = prendaTop && abajo && !esVestido ? estilo.fajar ?? 'suelta' : 'suelta';
  const doblada = estilo.mangas === 'dobladas';

  const pTop = prendaTop && !esVestido ? pinta(prendaTop) : null;
  const pAbajo = abajo ? pinta(abajo) : null;

  if (pTop && fajar === 'completa') cuerpo.push(top(m, prendaTop, pTop, { fajar, tiro }));
  if (abajo) {
    if (esVestido) cuerpo.push(vestido(m, abajo, pAbajo));
    else if (esFalda) cuerpo.push(falda(m, abajo, pAbajo, tiro));
    else cuerpo.push(pantalon(m, abajo, pAbajo, tiro));
  }
  if (prendaZapatos) cuerpo.push(zapatos(m, prendaZapatos));
  if (pTop && fajar !== 'completa') cuerpo.push(top(m, prendaTop, pTop, { fajar, tiro }));

  // Cinturón: va sobre el top pero debajo de la chaqueta.
  for (const acc of accesorios.filter((a) => a.tipoAccesorio === 'cinturon')) cuerpo.push(accesorio(m, acc, tiro));

  let pCapa = null;
  if (prendaCapa) {
    pCapa = pinta(prendaCapa);
    const abierta = prendaCapa.cierre === 'abierta' || estilo.capa !== 'cerrada';
    const debajo = pTop ? prendaTop.ajuste ?? 'recto' : esVestido ? abajo.ajuste ?? 'recto' : null;
    cuerpo.push(capa(m, prendaCapa, pCapa, { abierta, debajo }));
  }

  if (pTop) brazos.push(mangas(m, prendaTop, pTop, { holgura: 0.04, doblada }));
  if (esVestido) brazos.push(mangas(m, abajo, pAbajo, { holgura: 0.04, doblada: false }));
  if (pCapa) brazos.push(mangas(m, prendaCapa, pCapa, { holgura: 0.08, doblada }));

  for (const acc of accesorios) {
    if (acc.tipoAccesorio === 'cinturon') continue;
    (EN_CABEZA.includes(acc.tipoAccesorio) ? cabeza : brazos).push(accesorio(m, acc, tiro));
  }

  return {
    // Si lleva parte de arriba y de abajo, el body base ya no se ve.
    cubreBody: Boolean((prendaTop && abajo) || esVestido),
    defs: defs.join(''),
    cuerpo: cuerpo.join(''),
    brazos: brazos.join(''),
    cabeza: cabeza.join(''),
  };
}
