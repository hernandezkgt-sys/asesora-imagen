// Dibuja el avatar (SVG) a escala según el perfil de la persona.
import {
  curvaCerrada, simetrico, oscurecer, aclarar,
  formaRostro, caminoRostro, rasgosCara,
  caminoCabelloAtras, caminoCabelloFrente, brilloCabello,
} from './partes.js';

// El lienzo mide 240 x 400. Cada centímetro de estatura = 1.9 puntos.
export const ANCHO_LIENZO = 240;
export const ALTO_LIENZO = 400;
const ESCALA = 1.9;
const SUELO = 388;
const CENTRO = ANCHO_LIENZO / 2;

const AJUSTE_CADERA = { estrecha: 0.92, proporcional: 1, amplia: 1.1 };
const AJUSTE_BUSTO = { pequeno: 0.96, mediano: 1, grande: 1.07 };

// Dónde cae cada parte del cuerpo, como fracción del largo entre
// la barbilla (0) y el suelo (1).
const NIVEL = {
  baseCuello: 0.035,
  hombro: 0.075,
  axila: 0.13,
  busto: 0.165,
  bajoBusto: 0.21,
  cintura: 0.29,
  caderaAlta: 0.36,
  cadera: 0.425,
  entrepierna: 0.475,
  muslo: 0.5,
  musloMedio: 0.59,
  rodilla: 0.68,
  pantorrilla: 0.77,
  tobillo: 0.955,
  pie: 1,
  muneca: 0.45,
  dedos: 0.555,
};

const limitar = (n, min, max) => Math.min(max, Math.max(min, n));

// Calcula todas las medidas y puntos del cuerpo. Se exporta porque el
// Probador las usará después para colocar la ropa.
export function calcularMedidas(perfil) {
  const estatura = limitar(Number(perfil.estatura) || 160, 130, 200);
  const peso = limitar(Number(perfil.peso) || 58, 30, 200);
  const alto = estatura * ESCALA;
  const arriba = SUELO - alto;

  // Las personas más altas miden "más cabezas" de alto.
  const cabezas = limitar(7 + (estatura - 150) / 40, 6.8, 8);
  const altoCabeza = alto / cabezas;
  const u = altoCabeza * 0.8; // unidad de ancho del cuerpo

  // Complexión a partir de estatura y peso (solo para el dibujo).
  const imc = peso / (estatura / 100) ** 2;
  const f = limitar(1 + (imc - 21) * 0.03, 0.85, 1.5);

  const mc = AJUSTE_CADERA[perfil.cadera] ?? 1;
  const mb = AJUSTE_BUSTO[perfil.busto] ?? 1;

  const barbilla = arriba + altoCabeza;
  const largo = SUELO - barbilla;
  const nivelY = (fraccion) => barbilla + largo * fraccion;

  // Medio ancho (del centro hacia un lado) de cada parte.
  const ancho = {
    cuello: 0.24 * u * f ** 0.5,
    hombro: 1.08 * u * f ** 0.6,
    axila: 0.95 * u * f ** 0.9,
    busto: 0.92 * u * f ** 1.05 * mb,
    bajoBusto: 0.8 * u * f ** 1.1,
    cintura: 0.68 * u * f ** 1.3,
    caderaAlta: 0.88 * u * f * (1 + (mc - 1) * 0.6),
    cadera: 1.02 * u * f * mc,
  };

  // Con más complexión los muslos se acercan entre sí.
  const separacion = Math.max(0.15, 1 - (f - 1) * 2.2);
  const pierna = {
    fuera: {
      muslo: 0.97 * u * f * mc,
      musloMedio: 0.88 * u * f * (1 + (mc - 1) * 0.7),
      rodilla: 0.62 * u * f ** 1.05,
      pantorrilla: 0.66 * u * f ** 0.95,
      tobillo: 0.44 * u * f ** 0.6,
      pie: 0.48 * u,
    },
    dentro: {
      muslo: 0.05 * u * separacion,
      musloMedio: 0.06 * u * separacion,
      rodilla: 0.09 * u * separacion + 0.01 * u,
      pantorrilla: 0.07 * u * separacion + 0.01 * u,
      tobillo: 0.16 * u,
      pie: 0.12 * u,
    },
  };

  // Brazos: un poco separados del cuerpo, como en una ilustración de moda.
  const grosor = {
    brazo: 0.3 * u * f ** 1.15,
    codo: 0.24 * u * f ** 0.95,
    muneca: 0.15 * u * f ** 0.6,
  };
  const hombroX = ancho.hombro - 0.14 * u;
  const codoX = Math.max(ancho.cintura + grosor.codo / 2 + 0.05 * u, hombroX + 0.02 * u);
  const munecaX = Math.max(ancho.cadera + grosor.muneca / 2 + 0.07 * u, codoX + 0.03 * u);

  const ry = altoCabeza / 2;
  const cabeza = {
    cx: CENTRO,
    cy: arriba + ry,
    ry,
    rx: ry * formaRostro(perfil.rostro).ancho,
  };

  return {
    estatura, alto, arriba, altoCabeza, u, f,
    cx: CENTRO, suelo: SUELO, barbilla, nivelY, NIVEL,
    ancho, pierna, grosor, hombroX, codoX, munecaX, cabeza,
  };
}

// Contorno del cuerpo (cuello, torso y piernas) en una sola pieza.
function puntosCuerpo(m) {
  const { nivelY, ancho, pierna, u, barbilla, altoCabeza } = m;
  const derecha = [
    [ancho.cuello * 0.95, barbilla - 0.3 * altoCabeza],
    [ancho.cuello * 1.15, nivelY(NIVEL.baseCuello)],
    [ancho.hombro, nivelY(NIVEL.hombro)],
    [ancho.axila, nivelY(NIVEL.axila)],
    [ancho.busto, nivelY(NIVEL.busto)],
    [ancho.bajoBusto, nivelY(NIVEL.bajoBusto)],
    [ancho.cintura, nivelY(NIVEL.cintura)],
    [ancho.caderaAlta, nivelY(NIVEL.caderaAlta)],
    [ancho.cadera, nivelY(NIVEL.cadera)],
    [pierna.fuera.muslo, nivelY(NIVEL.muslo)],
    [pierna.fuera.musloMedio, nivelY(NIVEL.musloMedio)],
    [pierna.fuera.rodilla, nivelY(NIVEL.rodilla)],
    [pierna.fuera.pantorrilla, nivelY(NIVEL.pantorrilla)],
    [pierna.fuera.tobillo, nivelY(NIVEL.tobillo)],
    [pierna.fuera.pie, nivelY(NIVEL.pie)],
    [pierna.dentro.pie, nivelY(NIVEL.pie)],
    [pierna.dentro.tobillo, nivelY(NIVEL.tobillo)],
    [pierna.dentro.pantorrilla, nivelY(NIVEL.pantorrilla)],
    [pierna.dentro.rodilla, nivelY(NIVEL.rodilla)],
    [pierna.dentro.musloMedio, nivelY(NIVEL.musloMedio)],
    [pierna.dentro.muslo, nivelY(NIVEL.muslo)],
    [0, nivelY(NIVEL.entrepierna) - 0.02 * u],
  ];
  return simetrico(derecha, m.cx);
}

// Contorno de un brazo. lado = 1 (derecho) o -1 (izquierdo).
function puntosBrazo(m, lado) {
  const { nivelY, ancho, grosor, hombroX, codoX, munecaX, u, cx } = m;
  const yBrazo = 0.17;
  const avance = (yBrazo - NIVEL.hombro) / (NIVEL.cintura - NIVEL.hombro);
  const brazoX = hombroX + (codoX - hombroX) * avance;
  const puntos = [
    [hombroX - 0.12 * u, nivelY(0.064)],
    [ancho.hombro - 0.03 * u, nivelY(0.074)],
    [ancho.hombro + 0.05 * u, nivelY(0.1)],
    [brazoX + grosor.brazo / 2, nivelY(yBrazo)],
    [codoX + grosor.codo / 2, nivelY(NIVEL.cintura)],
    [munecaX + grosor.muneca / 2, nivelY(NIVEL.muneca)],
    [munecaX + grosor.muneca / 2 + 0.03 * u, nivelY(0.495)],
    [munecaX + 0.01 * u, nivelY(NIVEL.dedos)],
    [munecaX - grosor.muneca / 2 - 0.02 * u, nivelY(0.5)],
    [munecaX - grosor.muneca / 2, nivelY(NIVEL.muneca)],
    [codoX - grosor.codo / 2, nivelY(NIVEL.cintura)],
    [brazoX - grosor.brazo / 2, nivelY(yBrazo)],
    [hombroX - grosor.brazo / 2, nivelY(0.12)],
  ];
  return puntos.map(([dx, y]) => [cx + lado * dx, y]);
}

// Body básico (como un leotardo) para que el avatar se vea vestido
// mientras no tenga ropa del clóset.
function caminoBody(m) {
  const { cx, nivelY, u, ancho } = m;
  const lejos = 3 * u;
  const p = (x, y) => `${(cx + x).toFixed(1)},${y.toFixed(1)}`;
  return [
    `M${p(-0.85 * u, nivelY(0.055))}`,
    `L${p(-0.5 * u, nivelY(0.055))}`,
    `Q${p(0, nivelY(0.2))} ${p(0.5 * u, nivelY(0.055))}`,
    `L${p(0.85 * u, nivelY(0.055))}`,
    `L${p(0.95 * u, nivelY(0.1))}`,
    `L${p(lejos, nivelY(0.16))}`,
    `L${p(lejos, nivelY(0.4))}`,
    `L${p(ancho.cadera * 0.9, nivelY(0.405))}`,
    `Q${p(0.35 * u, nivelY(0.44))} ${p(0.12 * u, nivelY(0.49))}`,
    `L${p(-0.12 * u, nivelY(0.49))}`,
    `Q${p(-0.35 * u, nivelY(0.44))} ${p(-ancho.cadera * 0.9, nivelY(0.405))}`,
    `L${p(-lejos, nivelY(0.4))}`,
    `L${p(-lejos, nivelY(0.16))}`,
    `L${p(-0.95 * u, nivelY(0.1))}Z`,
  ].join(' ');
}

// Curvas suaves que sugieren el busto según su tamaño.
function lineasBusto(m, tipo) {
  const { cx, nivelY, u } = m;
  const forma = {
    pequeno: { bajo: 0.19, ancho: 0.6 },
    mediano: { bajo: 0.2, ancho: 0.68 },
    grande: { bajo: 0.215, ancho: 0.76 },
  }[tipo] ?? { bajo: 0.2, ancho: 0.68 };
  let d = '';
  for (const lado of [-1, 1]) {
    d += `M${(cx + lado * 0.07 * u).toFixed(1)},${nivelY(0.17).toFixed(1)} `;
    d += `Q${(cx + lado * 0.36 * u).toFixed(1)},${nivelY(forma.bajo + 0.02).toFixed(1)} `;
    d += `${(cx + lado * forma.ancho * u).toFixed(1)},${nivelY(0.165).toFixed(1)} `;
  }
  return d;
}

// Regla al costado para ver la estatura "a escala".
function regla(m) {
  let svg = '';
  for (let cm = 140; cm <= 190; cm += 10) {
    const y = SUELO - cm * ESCALA;
    svg += `<line x1="10" x2="20" y1="${y}" y2="${y}" stroke="#EBCBD6" stroke-width="1"/>`;
    svg += `<text x="22" y="${y + 2.5}" font-size="7" fill="#C9A3AE">${(cm / 100).toFixed(2)}</text>`;
  }
  svg += `<line x1="15" x2="15" y1="${SUELO - 190 * ESCALA}" y2="${SUELO}" stroke="#F3DCE4" stroke-width="1"/>`;
  // Marca de la estatura de la persona
  const etiqueta = `${(m.estatura / 100).toFixed(2)} m`;
  svg += `<line x1="${m.cx + m.cabeza.rx + 12}" x2="232" y1="${m.arriba}" y2="${m.arriba}" stroke="#D88AA5" stroke-width="0.8" stroke-dasharray="2 2"/>`;
  svg += `<text x="232" y="${m.arriba - 4}" font-size="9" font-weight="700" fill="#B84D72" text-anchor="end">${etiqueta}</text>`;
  return svg;
}

// Devuelve el avatar completo como texto SVG.
export function dibujarAvatar(perfil, { id = 'avatar', conRegla = true } = {}) {
  const m = calcularMedidas(perfil);
  const piel = perfil.piel || '#EFC0A0';
  const cabello = perfil.cabelloColor || '#3B2A20';
  const largo = perfil.cabelloLargo || 'hombros';
  const contornoPiel = oscurecer(piel, 0.25);
  const colorBody = '#EDB3C4';
  const { cx, cy, rx, ry } = m.cabeza;

  const cuerpo = curvaCerrada(puntosCuerpo(m));
  // Recorta el espacio vacío sobre la cabeza para que el avatar se vea grande.
  const encuadre = Math.max(0, Math.round(m.arriba - 26));

  return `
<svg viewBox="0 ${encuadre} ${ANCHO_LIENZO} ${ALTO_LIENZO - encuadre}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tu avatar">
  <defs>
    <radialGradient id="${id}-fondo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FCE3EC"/>
      <stop offset="100%" stop-color="#FCE3EC" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="${id}-silueta"><path d="${cuerpo}"/></clipPath>
  </defs>

  <circle cx="${cx}" cy="${(m.arriba + m.alto * 0.45).toFixed(1)}" r="${(m.alto * 0.42).toFixed(1)}" fill="url(#${id}-fondo)"/>
  <ellipse cx="${cx}" cy="${SUELO + 2}" rx="${(m.u * 1.6).toFixed(1)}" ry="4" fill="#EBC6D2" opacity="0.6"/>
  ${conRegla ? regla(m) : ''}

  <path d="${caminoCabelloAtras(largo, m)}" fill="${oscurecer(cabello, 0.15)}"/>

  <path d="${cuerpo}" fill="${piel}" stroke="${contornoPiel}" stroke-width="0.9" stroke-linejoin="round"/>
  <g clip-path="url(#${id}-silueta)">
    <path d="${caminoBody(m)}" fill="${colorBody}"/>
    <path d="${lineasBusto(m, perfil.busto)}" fill="none" stroke="${oscurecer(colorBody, 0.18)}" stroke-width="0.8" stroke-linecap="round"/>
  </g>
  <path d="${cuerpo}" fill="none" stroke="${contornoPiel}" stroke-width="0.9" stroke-linejoin="round"/>

  <path d="${curvaCerrada(puntosBrazo(m, 1))}" fill="${piel}" stroke="${contornoPiel}" stroke-width="0.9" stroke-linejoin="round"/>
  <path d="${curvaCerrada(puntosBrazo(m, -1))}" fill="${piel}" stroke="${contornoPiel}" stroke-width="0.9" stroke-linejoin="round"/>

  <ellipse cx="${cx}" cy="${(cy + ry * 0.98).toFixed(1)}" rx="${(rx * 0.42).toFixed(1)}" ry="${(ry * 0.16).toFixed(1)}" fill="${oscurecer(piel, 0.12)}"/>
  <path d="${caminoRostro(perfil.rostro, cx, cy, rx, ry)}" fill="${piel}" stroke="${contornoPiel}" stroke-width="0.9"/>
  ${rasgosCara({ cx, cy, rx, ry, piel, cabello })}

  <path d="${caminoCabelloFrente(largo, m)}" fill="${cabello}"/>
  <path d="${brilloCabello(m)}" fill="none" stroke="${aclarar(cabello, 0.5)}" stroke-width="${(ry * 0.07).toFixed(1)}" stroke-linecap="round" opacity="0.45"/>
</svg>`;
}
