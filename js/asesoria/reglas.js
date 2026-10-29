// Las reglas de la Asesora. Cada regla mira el outfit y responde:
//   - "bien": algo que te favorece
//   - "mejorar": algo que se puede ajustar, con su truco y, si se puede,
//     un "arreglo" que la app sabe aplicar (cambiar estilismo o una prenda).
// "objetivos" dice a qué objetivos de imagen pertenece la regla.
// Si una regla no tiene objetivos, aplica a todas.
import { categoria, color } from '../closet/catalogo.js';
import { OBJETIVOS } from './objetivos.js';

// ---------- Ayudas ----------

function luminancia(prenda) {
  const hex = color(prenda?.color)?.hex;
  if (!hex) return null;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Dos prendas "del mismo tono": mismo color o luminosidad muy parecida.
function tonoParecido(a, b) {
  if (!a?.color || !b?.color) return false;
  if (a.color === b.color) return true;
  const la = luminancia(a);
  const lb = luminancia(b);
  return la !== null && lb !== null && Math.abs(la - lb) < 0.12;
}

function nombre(prenda) {
  if (prenda.nota) return `"${prenda.nota}"`;
  if (prenda.categoria === 'jeans') return 'tus jeans';
  if (prenda.categoria === 'zapatos') return 'tus zapatos';
  const cat = categoria(prenda.categoria);
  return `tu ${cat?.nombre.split(' /')[0].toLowerCase() ?? 'prenda'}`;
}

const nombreMayuscula = (prenda) => {
  const texto = nombre(prenda);
  return texto[0] === '"' ? texto : texto[0].toUpperCase() + texto.slice(1);
};

const nombreColor = (prenda) => color(prenda.color)?.nombre.toLowerCase() ?? '';

const bien = (texto, peso = 1) => ({ tipo: 'bien', texto, peso });
const mejorar = (texto, truco, peso = 1, arreglo = null) => ({ tipo: 'mejorar', texto, truco, peso, arreglo });

// Arreglos que la app sabe aplicar en el Probador.
const cambiarEstilo = (cambio, texto) => ({ tipo: 'estilo', cambio, texto });
const probarPrenda = (ranura, filtro) => ({ tipo: 'prenda', ranura, filtro });

// Junta en un solo objeto lo que las reglas necesitan saber del outfit.
function contexto(outfit, perfil) {
  const { top, abajo, capa, zapatos, accesorios = [], estilo = {} } = outfit;
  const vestido = abajo?.categoria === 'vestido' ? abajo : null;
  const inferior = vestido ? null : abajo;
  const superior = vestido ?? top;
  const capaAbierta = Boolean(capa) && (capa.cierre === 'abierta' || estilo.capa !== 'cerrada');
  return {
    top, abajo, capa, zapatos, accesorios, estilo, vestido, inferior, superior, capaAbierta,
    fajar: top && inferior ? estilo.fajar ?? 'suelta' : 'suelta',
    visibles: [superior, inferior, capa].filter(Boolean),
    tieneAccesorio: (tipo) => accesorios.some((a) => a.tipoAccesorio === tipo),
    petite: (perfil?.estatura ?? 160) < 160,
    esFaldaOVestido: Boolean(vestido) || inferior?.categoria === 'falda',
    zapatoPlano: zapatos && (zapatos.tacon === 'plano' || (!zapatos.tacon && ['tenis', 'flats', 'mocasines', 'sandalias'].includes(zapatos.tipoZapato))),
  };
}

// ---------- Reglas ----------

export const REGLAS = [
  {
    id: 'escote-abierto',
    objetivos: ['alargar', 'rostro', 'busto-disimular'],
    evaluar: ({ superior }) => {
      if (!superior) return null;
      if (superior.cuello === 'v' || superior.cuello === 'cruzado') {
        return bien(`El escote en V de ${nombre(superior)} alarga tu cuello y estiliza tu rostro.`, 2);
      }
      if (superior.cuello === 'amplio') {
        return bien(`El escote amplio de ${nombre(superior)} despeja el cuello y alarga la figura.`, 1);
      }
      return null;
    },
  },
  {
    id: 'cuello-cerrado',
    objetivos: ['rostro', 'busto-disimular'],
    evaluar: (c) => {
      const { superior } = c;
      if (!superior || c.tieneAccesorio('collar-largo')) return null;
      const truco = 'Agrega un collar largo: rompe el cuello y dibuja una V.';
      const arreglo = probarPrenda('accesorios', (p) => p.tipoAccesorio === 'collar-largo');
      if (superior.cuello === 'alto') return mejorar('El cuello alto acorta el cuello y hace ver el rostro más ancho.', truco, 2, arreglo);
      if (superior.cuello === 'barco') return mejorar('El cuello barco ensancha hombros y busto.', truco, 1, arreglo);
      if (superior.cuello === 'redondo') return mejorar('El cuello redondo cerrado hace ver el cuello más corto.', truco, 1, arreglo);
      return null;
    },
  },
  {
    id: 'collar-largo',
    objetivos: ['rostro', 'alargar'],
    evaluar: (c) => {
      if (!c.tieneAccesorio('collar-largo')) return null;
      return c.superior?.cuello === 'alto'
        ? bien('El collar largo rompe el cuello alto y crea una V que estiliza.', 2)
        : bien('El collar largo crea una línea vertical que alarga tu cuello y tu figura.', 1);
    },
  },
  {
    id: 'capa-abierta',
    objetivos: ['alargar', 'abdomen', 'busto-disimular'],
    evaluar: ({ capa, capaAbierta }) =>
      capaAbierta ? bien(`Llevar ${nombre(capa)} sin cerrar crea dos líneas verticales que estilizan.`, 2) : null,
  },
  {
    id: 'capa-cerrada',
    objetivos: ['abdomen', 'busto-disimular', 'alargar'],
    evaluar: ({ capa, capaAbierta }) => {
      if (!capa || capaAbierta) return null;
      return mejorar(
        `Al cerrar ${nombre(capa)} se forma un bloque que agrega volumen.`,
        'Mejor sin cerrar, para crear líneas verticales.',
        1,
        cambiarEstilo({ capa: 'abierta' }, 'Abrir la capa'),
      );
    },
  },
  {
    id: 'fajar-frente',
    objetivos: ['alargar', 'cintura', 'abdomen'],
    evaluar: ({ fajar }) =>
      fajar === 'frente' ? bien('Fajar solo al frente marca tu cintura sin apretar y alarga tus piernas.', 2) : null,
  },
  {
    id: 'fajar-completo',
    objetivos: ['cintura', 'abdomen'],
    evaluar: ({ fajar, top }) => {
      if (fajar !== 'completa') return null;
      if (top.ajuste === 'pegado' || top.ajuste === 'recto') {
        return mejorar(
          'Fajar completo marca toda la zona del vientre.',
          'Fájalo solo al frente: define la cintura sin marcar.',
          1,
          cambiarEstilo({ fajar: 'frente' }, 'Fajar solo al frente'),
        );
      }
      return bien('Fajar el top define tu cintura.', 1);
    },
  },
  {
    id: 'top-suelto-largo',
    objetivos: ['alargar', 'cintura', 'caderas'],
    evaluar: ({ top, inferior, fajar }) => {
      if (!top || !inferior || fajar !== 'suelta') return null;
      if (!['cadera', 'muslo'].includes(top.largo) || top.ajuste === 'pegado') return null;
      const texto = top.largo === 'cadera'
        ? `Sin fajar, ${nombre(top)} termina justo en la cadera: la ensancha y esconde tu cintura.`
        : `Sin fajar, ${nombre(top)} esconde tu cintura y acorta tus piernas.`;
      return mejorar(texto, 'Fájalo solo al frente.', 2, cambiarEstilo({ fajar: 'frente' }, 'Fajar al frente'));
    },
  },
  {
    id: 'tiro',
    objetivos: ['alargar', 'cintura', 'abdomen'],
    evaluar: ({ inferior }) => {
      if (!inferior?.tiro) return null;
      if (inferior.tiro === 'alto') return bien(`El tiro alto de ${nombre(inferior)} alarga tus piernas.`, 2);
      if (inferior.tiro === 'bajo') {
        return mejorar(
          `El tiro bajo de ${nombre(inferior)} acorta las piernas y marca el abdomen.`,
          'Elige una prenda de tiro alto.',
          2,
          probarPrenda('abajo', (p) => p.tiro === 'alto'),
        );
      }
      return null;
    },
  },
  {
    id: 'tono-zapatos',
    objetivos: ['alargar'],
    evaluar: ({ zapatos, inferior, vestido }) => {
      const pierna = inferior ?? vestido;
      if (!zapatos || !pierna || zapatos.tipoZapato === 'botas') return null;
      if (zapatos.color === 'nude') return bien('Los zapatos color piel continúan la línea de la pierna y te alargan.', 2);
      if (tonoParecido(zapatos, pierna)) {
        return bien(`Tus zapatos del mismo tono que ${nombre(pierna)} alargan la pierna.`, 2);
      }
      const diferencia = Math.abs((luminancia(zapatos) ?? 0.5) - (luminancia(pierna) ?? 0.5));
      if (diferencia > 0.3) {
        return mejorar(
          `Tus zapatos en tono ${nombreColor(zapatos)} contrastan con ${nombre(pierna)} y cortan la pierna.`,
          `Usa zapatos nude o del mismo tono que ${nombre(pierna)}.`,
          2,
          probarPrenda('zapatos', (p) => p.color === 'nude' || tonoParecido(p, pierna)),
        );
      }
      return null;
    },
  },
  {
    id: 'tacon',
    objetivos: ['alargar'],
    evaluar: ({ zapatos }) => {
      if (!zapatos) return null;
      if (['medio', 'alto'].includes(zapatos.tacon) || zapatos.tipoZapato === 'plataformas') {
        return bien('El tacón suma altura y estiliza tu postura.', 1);
      }
      return null;
    },
  },
  {
    id: 'botines-falda',
    objetivos: ['alargar'],
    evaluar: ({ zapatos, esFaldaOVestido, inferior, vestido }) => {
      if (zapatos?.tipoZapato !== 'botines' || !esFaldaOVestido) return null;
      if (tonoParecido(zapatos, inferior ?? vestido)) return null;
      return mejorar(
        'Los botines con falda o vestido cortan la pierna a la altura del tobillo.',
        'Prueba zapatos nude, o botines del mismo tono que la falda o tus medias.',
        1,
        probarPrenda('zapatos', (p) => p.color === 'nude' || p.tipoZapato !== 'botines'),
      );
    },
  },
  {
    id: 'monocromo',
    objetivos: ['alargar'],
    evaluar: ({ top, inferior }) =>
      top && inferior && tonoParecido(top, inferior)
        ? bien('Un mismo tono arriba y abajo crea una columna de color que alarga.', 2)
        : null,
  },
  {
    id: 'rayas',
    objetivos: ['alargar', 'caderas', 'busto-disimular', 'abdomen'],
    evaluar: (c) => {
      const resultados = [];
      for (const prenda of c.visibles) {
        const ranura = prenda === c.capa ? 'capa' : prenda === c.top ? 'top' : 'abajo';
        if (prenda.estampado === 'rayas-horizontales') {
          resultados.push(mejorar(
            `Las rayas horizontales de ${nombre(prenda)} ensanchan y acortan.`,
            c.capaAbierta && ranura === 'top'
              ? 'Tu capa abierta ya ayuda; aún mejor con una prenda lisa o de rayas verticales.'
              : 'Cámbiala por una prenda lisa o de rayas verticales.',
            c.capaAbierta && ranura === 'top' ? 1 : 2,
            probarPrenda(ranura, (p) => p.categoria === prenda.categoria && ['liso', 'rayas-verticales', undefined].includes(p.estampado)),
          ));
        }
        if (prenda.estampado === 'rayas-verticales') {
          resultados.push(bien(`Las rayas verticales de ${nombre(prenda)} alargan la figura.`, 1));
        }
      }
      return resultados;
    },
  },
  {
    id: 'mangas',
    objetivos: ['brazos'],
    evaluar: ({ superior, capa, estilo }) => {
      if (!superior) return null;
      const manga = superior.manga;
      const descubiertos = ['sin-manga', 'tirantes'].includes(manga) || ['halter', 'sin-tirantes'].includes(superior.cuello);
      if (capa && (capa.manga ?? 'larga') !== 'corta') {
        return bien(`${nombreMayuscula(capa)} cubre y estiliza tus brazos.`, 2);
      }
      if (descubiertos) {
        return mejorar(
          'Tus brazos quedan descubiertos.',
          'Agrega un cárdigan o blazer ligero y llévalo abierto.',
          2,
          probarPrenda('capa', () => true),
        );
      }
      if (manga === 'corta') {
        return mejorar(
          'La manga corta termina en la parte más ancha del brazo.',
          'Prefiere manga 3/4 o agrega una capa abierta.',
          1,
          probarPrenda('capa', () => true),
        );
      }
      if (manga === 'tres-cuartos' || manga === 'larga') {
        return estilo.mangas === 'dobladas'
          ? bien('Las mangas dobladas dejan ver la muñeca, la parte más delgada del brazo.', 2)
          : bien(`Las mangas ${manga === 'larga' ? 'largas' : '3/4'} estilizan tus brazos.`, 1);
      }
      return null;
    },
  },
  {
    id: 'manga-abullonada',
    objetivos: ['brazos', 'busto-disimular', 'busto-volumen'],
    evaluar: ({ superior }, elegidos) => {
      if (superior?.manga !== 'abullonada') return null;
      if (elegidos.has('busto-volumen') && !elegidos.has('brazos')) {
        return bien('La manga abullonada da presencia a la parte de arriba.', 1);
      }
      return mejorar('La manga abullonada agrega volumen en hombros y brazos.', 'Prefiere una manga lisa, sin volumen.', 2);
    },
  },
  {
    id: 'pegado-arriba',
    objetivos: ['abdomen', 'cintura'],
    evaluar: ({ superior, capaAbierta }, elegidos) => {
      if (superior?.ajuste !== 'pegado') return null;
      if (elegidos.has('abdomen') && !capaAbierta) {
        return mejorar(
          'Una prenda pegada arriba marca la zona del abdomen.',
          'Prefiere telas con caída o agrega una capa abierta encima.',
          2,
          probarPrenda('capa', () => true),
        );
      }
      return bien('El ajuste entallado arriba marca tu cintura.', 1);
    },
  },
  {
    id: 'cruzado',
    objetivos: ['abdomen', 'cintura'],
    evaluar: ({ superior }) =>
      superior?.cuello === 'cruzado' ? bien('El corte cruzado disimula el vientre y dibuja la cintura.', 2) : null,
  },
  {
    id: 'crop',
    objetivos: ['abdomen', 'alargar'],
    evaluar: ({ top, inferior }, elegidos) => {
      if (top?.largo !== 'crop') return null;
      if (elegidos.has('abdomen')) {
        return mejorar(
          'El top corto deja el abdomen al descubierto.',
          'Combínalo con tiro alto o elige un top a la cadera y fájalo al frente.',
          2,
          probarPrenda('top', (p) => p.largo !== 'crop'),
        );
      }
      if (inferior?.tiro === 'alto') return bien('El top corto con tiro alto hace ver tus piernas más largas.', 2);
      return null;
    },
  },
  {
    id: 'tela-con-caida',
    objetivos: ['abdomen'],
    evaluar: ({ superior }) =>
      superior && ['gasa', 'seda', 'punto'].includes(superior.tela) && superior.ajuste !== 'pegado'
        ? bien(`La tela con caída de ${nombre(superior)} no se pega al cuerpo.`, 1)
        : null,
  },
  {
    id: 'cinturon',
    objetivos: ['cintura'],
    evaluar: (c) => {
      if (c.tieneAccesorio('cinturon')) return bien('El cinturón marca tu cintura.', 2);
      const suelto = c.vestido && ['suelto', 'oversize'].includes(c.vestido.ajuste);
      if (!suelto) return null;
      return mejorar(
        `Sin cinturón, ${nombre(c.vestido)} esconde tu cintura.`,
        'Agrega un cinturón a la altura de la cintura.',
        2,
        probarPrenda('accesorios', (p) => p.tipoAccesorio === 'cinturon'),
      );
    },
  },
  {
    id: 'pegado-abajo',
    objetivos: ['caderas'],
    evaluar: ({ inferior }) => {
      if (!inferior) return null;
      const pegado = inferior.ajuste === 'pegado' || inferior.pierna === 'entubado';
      if (pegado) {
        return mejorar(
          'Un corte pegado abajo resalta la cadera.',
          'Elige un pantalón recto o de pierna amplia, o una falda en A.',
          2,
          probarPrenda('abajo', (p) => ['recto', 'amplio', 'acampanado'].includes(p.pierna) || (p.categoria === 'falda' && p.ajuste === 'suelto')),
        );
      }
      if (['recto', 'amplio', 'acampanado'].includes(inferior.pierna) || (inferior.categoria === 'falda' && inferior.ajuste === 'suelto')) {
        return bien(`El corte de ${nombre(inferior)} equilibra tu cadera.`, 2);
      }
      return null;
    },
  },
  {
    id: 'detalles-arriba',
    objetivos: ['caderas', 'busto-volumen'],
    evaluar: ({ superior, inferior }) => {
      if (!superior) return null;
      const escoteLlamativo = ['barco', 'cuadrado', 'amplio', 'hombros-descubiertos'].includes(superior.cuello);
      const estampadoArriba = superior.estampado && superior.estampado !== 'liso' && (!inferior?.estampado || inferior.estampado === 'liso');
      return escoteLlamativo || estampadoArriba
        ? bien('Los detalles arriba llevan la mirada a tu rostro y equilibran la figura.', 1)
        : null;
    },
  },
  {
    id: 'claro-oscuro',
    objetivos: ['caderas'],
    evaluar: ({ superior, inferior }) => {
      if (!superior || !inferior) return null;
      const arriba = luminancia(superior);
      const abajo = luminancia(inferior);
      if (arriba === null || abajo === null) return null;
      if (arriba - abajo > 0.25) return bien('Claro arriba y oscuro abajo equilibra hombros y cadera.', 2);
      const llamativoAbajo = abajo - arriba > 0.25 || (inferior.estampado && inferior.estampado !== 'liso');
      if (llamativoAbajo) {
        return mejorar(
          'El color claro o estampado abajo lleva la mirada a la cadera.',
          'Usa el tono claro o el estampado arriba y el oscuro abajo.',
          1,
          probarPrenda('abajo', (p) => (luminancia(p) ?? 1) < arriba - 0.15 && (!p.estampado || p.estampado === 'liso')),
        );
      }
      return null;
    },
  },
  {
    id: 'volumen-busto',
    objetivos: ['busto-volumen'],
    evaluar: ({ superior }) => {
      if (!superior) return null;
      if (['cuadrado', 'redondo', 'barco'].includes(superior.cuello) || (luminancia(superior) ?? 0) > 0.7) {
        return bien('El escote y el tono de la parte de arriba dan presencia al busto.', 1);
      }
      if (superior.cuello === 'v' && (luminancia(superior) ?? 1) < 0.3 && superior.ajuste === 'pegado') {
        return mejorar(
          'El escote en V oscuro y pegado reduce visualmente el busto.',
          'Prueba un cuello redondo o cuadrado, en tono claro o con estampado.',
          1,
          probarPrenda('top', (p) => ['redondo', 'cuadrado', 'barco'].includes(p.cuello)),
        );
      }
      return null;
    },
  },
  {
    id: 'disimular-busto',
    objetivos: ['busto-disimular'],
    evaluar: ({ superior }) => {
      if (!superior) return null;
      if (['flores', 'animal', 'cuadros', 'lunares', 'geometrico'].includes(superior.estampado)) {
        return mejorar(
          'El estampado arriba atrae la mirada al busto.',
          'Prefiere arriba liso y el estampado abajo.',
          1,
          probarPrenda('top', (p) => !p.estampado || p.estampado === 'liso'),
        );
      }
      if (superior.tela === 'seda') {
        return mejorar('El brillo de la seda o el satín agrega volumen al busto.', 'Prefiere telas mate arriba.', 1);
      }
      return null;
    },
  },
  {
    id: 'telas-gruesas',
    objetivos: ['abdomen', 'busto-disimular'],
    petite: true,
    evaluar: ({ visibles }) => {
      const gruesa = visibles.find((p) => p.tela === 'grueso');
      return gruesa
        ? mejorar(`La tela gruesa de ${nombre(gruesa)} agrega volumen y te achica.`, 'Prefiere tejidos delgados que caigan.', 1)
        : null;
    },
  },
  {
    id: 'crop-holgado-petite',
    objetivos: [],
    petite: true,
    evaluar: ({ top }) =>
      top?.largo === 'crop' && ['suelto', 'oversize'].includes(top.ajuste)
        ? mejorar('Un top corto y holgado ensancha y acorta la figura.', 'Si es corto, que sea ajustado; si es holgado, que llegue a la cadera y fájalo al frente.', 2)
        : null,
  },
  {
    id: 'oversize-petite',
    objetivos: [],
    petite: true,
    evaluar: ({ visibles, fajar }) => {
      const grande = visibles.find((p) => p.ajuste === 'oversize');
      if (!grande || fajar !== 'suelta') return null;
      return mejorar(
        `${nombreMayuscula(grande)} oversize puede "comerte" si eres petite.`,
        'Equilibra: si arriba es holgado, que abajo sea ajustado, y marca la cintura.',
        1,
      );
    },
  },
  {
    id: 'abrigo-largo-petite',
    objetivos: [],
    petite: true,
    evaluar: ({ capa, capaAbierta }) =>
      capa && ['rodilla', 'largo'].includes(capa.largo) && !capaAbierta
        ? mejorar('Un abrigo largo y cerrado te hace ver más baja.', 'Llévalo abierto.', 2, cambiarEstilo({ capa: 'abierta' }, 'Abrir la capa'))
        : null,
  },
  {
    id: 'midi-plano-petite',
    objetivos: [],
    petite: true,
    evaluar: ({ inferior, vestido, zapatoPlano }) => {
      const prenda = vestido ?? (inferior?.categoria === 'falda' ? inferior : null);
      if (!prenda || !['midi', 'largo'].includes(prenda.largo) || !zapatoPlano) return null;
      return mejorar(
        'Una falda midi con zapato plano acorta la pierna.',
        'Agrega un poco de tacón o usa zapatos nude.',
        1,
        probarPrenda('zapatos', (p) => ['bajo', 'medio', 'alto'].includes(p.tacon) || p.color === 'nude'),
      );
    },
  },
];

// ---------- Calificación ----------

const nombreObjetivo = (id) => OBJETIVOS.find((o) => o.id === id)?.nombre;

const FRASES = [
  [9, '¡Te ves increíble!'],
  [7, 'Muy buen outfit'],
  [5, 'Va bien; con un par de ajustes brilla'],
  [0, 'Probemos unos cambios'],
];

// Califica un outfit del 1 al 10 según los objetivos de la persona.
export function evaluarOutfit(outfit, perfil, objetivos) {
  const c = contexto(outfit, perfil);
  const elegidos = new Set(objetivos?.elegidos ?? []);
  const principal = objetivos?.principal;
  const sinObjetivos = elegidos.size === 0;

  // Cuánto pesa cada regla según los objetivos elegidos.
  const importancia = (regla) => {
    if (sinObjetivos) return 0.7;
    if (principal && regla.objetivos.includes(principal)) return 1.6;
    if (regla.objetivos.some((o) => elegidos.has(o))) return 1;
    if (regla.petite && c.petite) return 0.8;
    if (!regla.objetivos.length) return 0.8;
    return 0;
  };

  const favorece = [];
  const mejoras = [];
  let suma = 0;
  const vistos = new Set();

  for (const regla of REGLAS) {
    if (regla.petite && !c.petite) continue;
    const peso = importancia(regla);
    if (!peso) continue;
    const resultado = regla.evaluar(c, elegidos);
    for (const r of [resultado].flat().filter(Boolean)) {
      if (vistos.has(r.texto)) continue;
      vistos.add(r.texto);
      const etiqueta = regla.objetivos.find((o) => o === principal)
        ?? regla.objetivos.find((o) => elegidos.has(o))
        ?? (regla.petite ? 'petite' : null);
      const item = {
        ...r,
        regla: regla.id,
        etiqueta: etiqueta === 'petite' ? 'Petite' : nombreObjetivo(etiqueta) ?? null,
        importancia: peso * r.peso,
      };
      if (r.tipo === 'bien') {
        favorece.push(item);
        suma += item.importancia;
      } else {
        mejoras.push(item);
        suma -= item.importancia * 1.1;
      }
    }
  }

  favorece.sort((a, b) => b.importancia - a.importancia);
  mejoras.sort((a, b) => b.importancia - a.importancia);
  const puntos = Math.max(1, Math.min(10, Math.round(6 + suma * 0.55)));
  const frase = FRASES.find(([minimo]) => puntos >= minimo)[1];
  return { puntos, frase, favorece, mejoras, sinObjetivos, petite: c.petite };
}
