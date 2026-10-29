// El "cajón" de la app: guarda y lee datos en el propio teléfono (IndexedDB).
// No hay servidor: nada sale del dispositivo.

const NOMBRE_BD = 'asesora-imagen';
const VERSION_BD = 2;

let conexion;

function abrir() {
  if (!conexion) {
    conexion = new Promise((resolver, rechazar) => {
      const peticion = indexedDB.open(NOMBRE_BD, VERSION_BD);
      peticion.onupgradeneeded = () => {
        const bd = peticion.result;
        // "ajustes" guarda cosas sueltas por nombre: el perfil, la foto, etc.
        if (!bd.objectStoreNames.contains('ajustes')) bd.createObjectStore('ajustes');
        // "prendas" guarda cada prenda del clóset con su propio número.
        if (!bd.objectStoreNames.contains('prendas')) {
          bd.createObjectStore('prendas', { keyPath: 'id', autoIncrement: true });
        }
      };
      peticion.onsuccess = () => resolver(peticion.result);
      peticion.onerror = () => rechazar(peticion.error);
    });
    // Pide al navegador que no borre estos datos cuando falte espacio.
    navigator.storage?.persist?.().catch(() => {});
  }
  return conexion;
}

async function operacion(cajon, modo, accion) {
  const bd = await abrir();
  return new Promise((resolver, rechazar) => {
    const transaccion = bd.transaction(cajon, modo);
    const peticion = accion(transaccion.objectStore(cajon));
    transaccion.oncomplete = () => resolver(peticion.result);
    transaccion.onerror = () => rechazar(transaccion.error);
  });
}

export const leer = (clave) => operacion('ajustes', 'readonly', (cajon) => cajon.get(clave));
export const guardar = (clave, valor) => operacion('ajustes', 'readwrite', (cajon) => cajon.put(valor, clave));
export const borrar = (clave) => operacion('ajustes', 'readwrite', (cajon) => cajon.delete(clave));

export const listarPrendas = () => operacion('prendas', 'readonly', (cajon) => cajon.getAll());
export const leerPrenda = (id) => operacion('prendas', 'readonly', (cajon) => cajon.get(id));
// Devuelve el número de la prenda (nuevo si es la primera vez que se guarda).
export const guardarPrenda = (prenda) => operacion('prendas', 'readwrite', (cajon) => cajon.put(prenda));
export const borrarPrenda = (id) => operacion('prendas', 'readwrite', (cajon) => cajon.delete(id));
