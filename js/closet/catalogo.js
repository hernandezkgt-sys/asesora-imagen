// Catálogo del clóset: categorías de prendas, colores y las preguntas
// (campos) que aplican a cada una. La Asesora y el Probador usan estos "id".

export const GRUPOS = [
  { id: 'arriba', nombre: 'Tops' },
  { id: 'abajo', nombre: 'Abajo' },
  { id: 'vestidos', nombre: 'Vestidos' },
  { id: 'capas', nombre: 'Capas' },
  { id: 'zapatos', nombre: 'Zapatos' },
  { id: 'complementos', nombre: 'Bolsas y accesorios' },
];

export const CATEGORIAS = [
  { id: 'playera', nombre: 'Playera', grupo: 'arriba' },
  { id: 'blusa', nombre: 'Blusa', grupo: 'arriba' },
  { id: 'camisa', nombre: 'Camisa', grupo: 'arriba' },
  { id: 'sudadera', nombre: 'Sudadera / hoodie', grupo: 'arriba' },
  { id: 'sueter', nombre: 'Suéter', grupo: 'arriba' },
  { id: 'pantalon', nombre: 'Pantalón', grupo: 'abajo' },
  { id: 'jeans', nombre: 'Jeans', grupo: 'abajo' },
  { id: 'short', nombre: 'Short', grupo: 'abajo' },
  { id: 'falda', nombre: 'Falda', grupo: 'abajo' },
  { id: 'vestido', nombre: 'Vestido', grupo: 'vestidos' },
  { id: 'chaqueta', nombre: 'Chaqueta', grupo: 'capas' },
  { id: 'blazer', nombre: 'Blazer', grupo: 'capas' },
  { id: 'cardigan', nombre: 'Cárdigan', grupo: 'capas' },
  { id: 'zapatos', nombre: 'Zapatos', grupo: 'zapatos' },
  { id: 'bolsa', nombre: 'Bolsa', grupo: 'complementos' },
  { id: 'accesorio', nombre: 'Accesorio', grupo: 'complementos' },
];

export const categoria = (id) => CATEGORIAS.find((c) => c.id === id);

export const COLORES = [
  { id: 'negro', nombre: 'Negro', hex: '#1E1B1D' },
  { id: 'blanco', nombre: 'Blanco', hex: '#FAFAF7' },
  { id: 'crema', nombre: 'Crema', hex: '#F1E7D2' },
  { id: 'gris', nombre: 'Gris', hex: '#9A979A' },
  { id: 'nude', nombre: 'Nude / color piel', hex: '#DDB89C' },
  { id: 'camel', nombre: 'Camel', hex: '#C19461' },
  { id: 'cafe', nombre: 'Café', hex: '#6B4430' },
  { id: 'marino', nombre: 'Azul marino', hex: '#1F2D4E' },
  { id: 'mezclilla', nombre: 'Mezclilla', hex: '#4F6E96' },
  { id: 'azul', nombre: 'Azul', hex: '#2F62C2' },
  { id: 'celeste', nombre: 'Celeste', hex: '#A9CBEA' },
  { id: 'verde', nombre: 'Verde', hex: '#2F8A57' },
  { id: 'olivo', nombre: 'Verde olivo', hex: '#6B6B3A' },
  { id: 'menta', nombre: 'Verde menta', hex: '#B5E0CB' },
  { id: 'amarillo', nombre: 'Amarillo', hex: '#F2CF45' },
  { id: 'mostaza', nombre: 'Mostaza', hex: '#C99A2E' },
  { id: 'naranja', nombre: 'Naranja', hex: '#E8743B' },
  { id: 'rojo', nombre: 'Rojo', hex: '#C62F36' },
  { id: 'vino', nombre: 'Vino', hex: '#6E1F33' },
  { id: 'rosa', nombre: 'Rosa', hex: '#E87FA4' },
  { id: 'palo', nombre: 'Rosa palo', hex: '#F2C9D2' },
  { id: 'fucsia', nombre: 'Fucsia', hex: '#C8237A' },
  { id: 'morado', nombre: 'Morado', hex: '#6A3D8F' },
  { id: 'lila', nombre: 'Lila', hex: '#C3A9DD' },
  { id: 'dorado', nombre: 'Dorado', hex: '#C9A54A' },
  { id: 'plateado', nombre: 'Plateado', hex: '#C4C7CC' },
  { id: 'multicolor', nombre: 'Multicolor', hex: '#E87FA4' },
];

export const color = (id) => COLORES.find((c) => c.id === id);

const opciones = (lista) => lista.map(([id, nombre]) => ({ id, nombre }));

const ROPA = ['arriba', 'abajo', 'vestidos', 'capas'];
const enGrupo = (...grupos) => (cat) => grupos.includes(cat.grupo);
const enCategoria = (...ids) => (cat) => ids.includes(cat.id);

// Las preguntas, en el orden en que aparecen en el formulario.
// "aplica" decide si se pregunta para esa categoría.
export const CAMPOS = [
  {
    id: 'tipoZapato',
    nombre: 'Tipo de zapato',
    aplica: enCategoria('zapatos'),
    opciones: () => opciones([
      ['tenis', 'Tenis'], ['flats', 'Flats / balerinas'], ['mocasines', 'Mocasines'],
      ['tacones', 'Tacones'], ['plataformas', 'Plataformas'], ['botines', 'Botines'],
      ['botas', 'Botas'], ['sandalias', 'Sandalias'],
    ]),
  },
  {
    id: 'tacon',
    nombre: 'Altura del tacón',
    aplica: enCategoria('zapatos'),
    opciones: () => opciones([
      ['plano', 'Plano'], ['bajo', 'Bajo (hasta 5 cm)'], ['medio', 'Medio (5 a 8 cm)'], ['alto', 'Alto (más de 8 cm)'],
    ]),
  },
  {
    id: 'tipoAccesorio',
    nombre: '¿Qué accesorio es?',
    aplica: enCategoria('accesorio'),
    opciones: () => opciones([
      ['collar-corto', 'Collar corto'], ['collar-largo', 'Collar largo'], ['aretes', 'Aretes'],
      ['cinturon', 'Cinturón'], ['bufanda', 'Bufanda / pañoleta'], ['sombrero', 'Sombrero / gorra'],
      ['lentes', 'Lentes'], ['pulsera', 'Reloj / pulsera'],
    ]),
  },
  {
    id: 'tamano',
    nombre: 'Tamaño',
    aplica: enCategoria('bolsa'),
    opciones: () => opciones([['pequena', 'Pequeña'], ['mediana', 'Mediana'], ['grande', 'Grande']]),
  },
  {
    id: 'estampado',
    nombre: 'Estampado',
    aplica: () => true,
    opciones: () => opciones([
      ['liso', 'Liso'], ['rayas-horizontales', 'Rayas horizontales'], ['rayas-verticales', 'Rayas verticales'],
      ['cuadros', 'Cuadros'], ['flores', 'Flores'], ['lunares', 'Lunares'],
      ['animal', 'Animal print'], ['geometrico', 'Geométrico'], ['otro', 'Otro'],
    ]),
  },
  {
    id: 'cuello',
    nombre: 'Tipo de cuello',
    aplica: enGrupo('arriba', 'vestidos'),
    opciones: () => opciones([
      ['v', 'En V'], ['redondo', 'Redondo'], ['amplio', 'Redondo amplio'], ['cuadrado', 'Cuadrado'],
      ['barco', 'Barco'], ['camisero', 'Camisero'], ['alto', 'Alto / tortuga'], ['halter', 'Halter'],
      ['cruzado', 'Cruzado'], ['sin-tirantes', 'Sin tirantes'], ['hombros-descubiertos', 'Hombros descubiertos'],
    ]),
  },
  {
    id: 'manga',
    nombre: 'Largo de manga',
    aplica: enGrupo('arriba', 'vestidos', 'capas'),
    opciones: () => opciones([
      ['sin-manga', 'Sin manga'], ['tirantes', 'Tirantes'], ['corta', 'Corta'],
      ['tres-cuartos', '3/4'], ['larga', 'Larga'], ['abullonada', 'Abullonada'],
    ]),
  },
  {
    id: 'largo',
    nombre: 'Largo de la prenda',
    aplica: (cat) => ROPA.includes(cat.grupo),
    opciones: (cat) => {
      if (cat.grupo === 'arriba') {
        return opciones([['crop', 'Corto / crop'], ['cintura', 'A la cintura'], ['cadera', 'A la cadera'], ['muslo', 'Medio muslo']]);
      }
      if (cat.grupo === 'capas') {
        return opciones([['crop', 'Corta / crop'], ['cintura', 'A la cintura'], ['cadera', 'A la cadera'], ['muslo', 'Medio muslo'], ['rodilla', 'A la rodilla'], ['largo', 'Larga']]);
      }
      if (cat.id === 'pantalon' || cat.id === 'jeans') {
        return opciones([['capri', 'Capri / pescador'], ['tobillo', 'Al tobillo'], ['largo', 'Largo (cubre el zapato)']]);
      }
      if (cat.id === 'short') {
        return opciones([['mini', 'Muy corto'], ['medio', 'Medio muslo'], ['bermuda', 'Bermuda']]);
      }
      return opciones([['mini', 'Mini'], ['rodilla', 'A la rodilla'], ['midi', 'Midi'], ['largo', 'Largo']]);
    },
  },
  {
    id: 'pierna',
    nombre: 'Corte de pierna',
    aplica: enCategoria('pantalon', 'jeans'),
    opciones: () => opciones([
      ['entubado', 'Entubado / skinny'], ['recto', 'Recto'], ['amplio', 'Amplio / palazzo'],
      ['acampanado', 'Acampanado'], ['holgado', 'Holgado (mom, boyfriend)'],
    ]),
  },
  {
    id: 'tiro',
    nombre: 'Tiro',
    ayuda: 'Dónde queda la pretina: abajo del ombligo, en el ombligo o arriba.',
    aplica: enGrupo('abajo'),
    opciones: () => opciones([['bajo', 'Bajo'], ['medio', 'Medio'], ['alto', 'Alto']]),
  },
  {
    id: 'cierre',
    nombre: '¿Se puede cerrar?',
    aplica: enGrupo('capas'),
    opciones: () => opciones([['abierta', 'Abierta (no se cierra)'], ['cierra', 'Se puede cerrar']]),
  },
  {
    id: 'ajuste',
    nombre: 'Ajuste',
    aplica: (cat) => ROPA.includes(cat.grupo),
    opciones: () => opciones([['pegado', 'Pegado'], ['recto', 'Recto'], ['suelto', 'Suelto'], ['oversize', 'Oversize']]),
  },
  {
    id: 'tela',
    nombre: 'Tela',
    aplica: (cat) => ROPA.includes(cat.grupo),
    opciones: () => opciones([
      ['algodon', 'Algodón'], ['mezclilla', 'Mezclilla'], ['lino', 'Lino'], ['seda', 'Seda / satín'],
      ['gasa', 'Gasa / chifón'], ['punto', 'Tejido delgado'], ['grueso', 'Tejido grueso / lana'],
      ['piel', 'Piel / vinipiel'], ['licra', 'Licra / elástica'], ['poliester', 'Poliéster'],
    ]),
  },
];

export const camposDe = (cat) => CAMPOS.filter((campo) => campo.aplica(cat));
