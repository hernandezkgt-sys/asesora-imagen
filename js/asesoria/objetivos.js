// Catálogo de objetivos de imagen. La Asesora usará estos mismos "id"
// para saber qué buscar al calificar un outfit.

export const OBJETIVOS = [
  {
    id: 'alargar',
    nombre: 'Alargar la figura',
    descripcion: 'Verme más alta y estilizada.',
    tip: 'Tiro alto, zapatos del tono del pantalón o color piel, y un mismo color de pies a cabeza crean una línea larga.',
    icono: '<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/>',
  },
  {
    id: 'brazos',
    nombre: 'Disimular brazos',
    descripcion: 'Que los brazos se vean más ligeros.',
    tip: 'Mangas 3/4 o abajo del codo, y capas abiertas y ligeras como un cárdigan o kimono. Evita mangas que terminan en la parte más ancha del brazo.',
    icono: '<path d="M9 3 4 8l3 3 2-2v12h6V9l2 2 3-3-5-5"/><path d="M9 3c.8 1.6 1.8 2.4 3 2.4S14.2 4.6 15 3"/>',
  },
  {
    id: 'abdomen',
    nombre: 'Disimular abdomen',
    descripcion: 'Suavizar la zona del vientre.',
    tip: 'Telas con caída que no se pegan, cortes cruzados o envolventes, y capas abiertas que dibujan líneas verticales.',
    icono: '<path d="M8 3h8l-1 5c2 2 3 5 3 8l1 5H5l1-5c0-3 1-6 3-8L8 3z"/><path d="M10 12c1 4 1 6 0 9M14 12c-1 4-1 6 0 9"/>',
  },
  {
    id: 'rostro',
    nombre: 'Estilizar rostro y cuello',
    descripcion: 'Que el cuello se vea más largo y el rostro más fino.',
    tip: 'Escotes en V o amplios y collares largos alargan el cuello. Si buscas estilizar, evita cuellos altos y cerrados.',
    icono: '<circle cx="12" cy="6.5" r="3.5"/><path d="M4 21c.5-5 3-8 5-9l3 5 3-5c2 1 4.5 4 5 9"/>',
  },
  {
    id: 'cintura',
    nombre: 'Resaltar cintura',
    descripcion: 'Marcar la parte más angosta del torso.',
    tip: 'Fajar la blusa solo al frente, usar cinturón a la altura de la cintura y prendas que entallan justo ahí.',
    icono: '<path d="M7 3h10c0 4-3 6-3 9s3 5 3 9H7c0-4 3-6 3-9S7 7 7 3z"/><path d="M9.5 12h5"/>',
  },
  {
    id: 'caderas',
    nombre: 'Equilibrar caderas',
    descripcion: 'Que hombros y caderas se vean en armonía.',
    tip: 'Lleva la atención arriba con detalles en hombros y escote, colores claros arriba y oscuros abajo, y pantalones rectos o de pierna amplia.',
    icono: '<path d="M12 4v16M5 8h14M5 8l-2.5 6h5L5 8zM19 8l-2.5 6h5L19 8zM8 20h8"/>',
  },
  {
    id: 'busto-volumen',
    nombre: 'Dar volumen al busto',
    descripcion: 'Agregar presencia a la parte de arriba.',
    tip: 'Estampados, bolsillos, olanes o detalles en el pecho, y escotes cuadrados o redondos.',
    icono: '<path d="M5 8c2 0 3-2 3-4h8c0 2 1 4 3 4v12H5V8z"/><path d="M12 10v6M9 13h6"/>',
  },
  {
    id: 'busto-disimular',
    nombre: 'Disimular busto',
    descripcion: 'Suavizar la parte de arriba.',
    tip: 'Escotes en V, telas lisas y sin brillo arriba, y prendas sin bolsillos ni detalles en el pecho.',
    icono: '<path d="M5 8c2 0 3-2 3-4l4 6 4-6c0 2 1 4 3 4v12H5V8z"/>',
  },
];

// Objetivos que la app sugiere según el perfil, con el motivo.
// Solo son sugerencias: la persona decide.
export function sugerenciasPara(perfil) {
  const sugerencias = {};
  if (!perfil) return sugerencias;
  if (perfil.estatura < 160) sugerencias.alargar = 'Eres petite: alargar la figura suele favorecerte.';
  if (perfil.cadera === 'amplia') sugerencias.caderas = 'Tu cadera es más ancha que tus hombros.';
  if (perfil.busto === 'pequeno') sugerencias['busto-volumen'] = 'Tu busto es pequeño.';
  if (perfil.busto === 'grande') sugerencias['busto-disimular'] = 'Tu busto es grande.';
  if (perfil.rostro === 'redondo' || perfil.rostro === 'cuadrado') {
    sugerencias.rostro = `Tu rostro es ${perfil.rostro}: las líneas verticales lo estilizan.`;
  }
  return sugerencias;
}
