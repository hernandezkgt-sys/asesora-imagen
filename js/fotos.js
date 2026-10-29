// Herramientas para fotos: achicarlas antes de guardarlas y adivinar
// el color principal de una prenda.

// Achica la foto para no llenar la memoria del teléfono.
export async function reducirFoto(archivo, maximo = 1400, calidad = 0.85) {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((resolver) => lienzo.toBlob(resolver, 'image/jpeg', calidad));
}

// Convierte un color RGB a "Lab", una forma de medir colores parecida
// a como los percibe el ojo humano (sirve para comparar tonos).
function aLab([r, g, b]) {
  const lineal = (v) => {
    const c = v / 255;
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
  };
  const [lr, lg, lb] = [lineal(r), lineal(g), lineal(b)];
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const hexARgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function masParecido(lab, paleta) {
  let mejor = paleta[0];
  let menor = Infinity;
  for (const opcion of paleta) {
    const [l, a, b] = opcion.lab;
    const distancia = (lab[0] - l) ** 2 + (lab[1] - a) ** 2 + (lab[2] - b) ** 2;
    if (distancia < menor) {
      menor = distancia;
      mejor = opcion;
    }
  }
  return mejor;
}

// Adivina el color principal de la prenda en la foto.
// Da más peso al centro (donde suele estar la prenda) y menos al color
// de las orillas (que suele ser el fondo).
export async function detectarColor(foto, colores) {
  const paleta = colores
    .filter((c) => c.id !== 'multicolor')
    .map((c) => ({ ...c, lab: aLab(hexARgb(c.hex)) }));
  const lado = 48;
  const imagen = await createImageBitmap(foto);
  const lienzo = document.createElement('canvas');
  lienzo.width = lado;
  lienzo.height = lado;
  const contexto = lienzo.getContext('2d', { willReadFrequently: true });
  contexto.drawImage(imagen, 0, 0, lado, lado);
  imagen.close();
  const { data } = contexto.getImageData(0, 0, lado, lado);

  const votosCentro = new Map();
  const votosOrilla = new Map();
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const i = (y * lado + x) * 4;
      if (data[i + 3] < 128) continue;
      const opcion = masParecido(aLab([data[i], data[i + 1], data[i + 2]]), paleta);
      const orilla = x < 4 || y < 4 || x >= lado - 4 || y >= lado - 4;
      const votos = orilla ? votosOrilla : votosCentro;
      // Cuanto más cerca del centro, más cuenta el voto.
      const dx = (x - lado / 2) / (lado / 2);
      const dy = (y - lado / 2) / (lado / 2);
      const peso = orilla ? 1 : Math.max(0.1, 1 - (dx * dx + dy * dy) * 0.6);
      votos.set(opcion.id, (votos.get(opcion.id) ?? 0) + peso);
    }
  }

  // El color que domina las orillas probablemente es el fondo: le resta votos.
  const fondo = [...votosOrilla.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (fondo && votosCentro.has(fondo)) votosCentro.set(fondo, votosCentro.get(fondo) * 0.35);

  const ganador = [...votosCentro.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return colores.find((c) => c.id === ganador) ?? null;
}
