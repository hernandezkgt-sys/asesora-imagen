// El "cajón" de la app: guarda y lee datos en el propio teléfono (IndexedDB).
// No hay servidor: nada sale del dispositivo.

const NOMBRE_BD = 'asesora-imagen';
const VERSION_BD = 1;

let conexion;

function abrir() {
  if (!conexion) {
    conexion = new Promise((resolver, rechazar) => {
      const peticion = indexedDB.open(NOMBRE_BD, VERSION_BD);
      peticion.onupgradeneeded = () => {
        const bd = peticion.result;
        // "ajustes" guarda cosas sueltas por nombre: el perfil, la foto, etc.
        if (!bd.objectStoreNames.contains('ajustes')) bd.createObjectStore('ajustes');
      };
      peticion.onsuccess = () => resolver(peticion.result);
      peticion.onerror = () => rechazar(peticion.error);
    });
    // Pide al navegador que no borre estos datos cuando falte espacio.
    navigator.storage?.persist?.().catch(() => {});
  }
  return conexion;
}

async function operacion(modo, accion) {
  const bd = await abrir();
  return new Promise((resolver, rechazar) => {
    const transaccion = bd.transaction('ajustes', modo);
    const peticion = accion(transaccion.objectStore('ajustes'));
    transaccion.oncomplete = () => resolver(peticion.result);
    transaccion.onerror = () => rechazar(transaccion.error);
  });
}

export const leer = (clave) => operacion('readonly', (cajon) => cajon.get(clave));
export const guardar = (clave, valor) => operacion('readwrite', (cajon) => cajon.put(valor, clave));
export const borrar = (clave) => operacion('readwrite', (cajon) => cajon.delete(clave));
