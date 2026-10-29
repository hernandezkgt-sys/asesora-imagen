// El "recepcionista": muestra la pantalla que corresponde según el menú.
import * as perfil from './pantallas/perfil.js';
import * as objetivos from './pantallas/objetivos.js';
import * as closet from './pantallas/closet.js';
import * as probador from './pantallas/probador.js';

const PANTALLAS = {
  perfil: { titulo: 'Mi perfil', modulo: perfil },
  objetivos: { titulo: 'Mis objetivos', modulo: objetivos },
  closet: { titulo: 'Mi clóset', modulo: closet },
  probador: { titulo: 'Probador', modulo: probador },
  asesora: { titulo: 'Tu asesora' },
  outfit: { titulo: 'Outfit del día' },
};

const contenido = document.getElementById('contenido');
const titulo = document.getElementById('titulo-pantalla');
let pantallaActual;

async function mostrarPantalla() {
  const id = location.hash.slice(1);
  const clave = PANTALLAS[id] ? id : 'perfil';
  const pantalla = PANTALLAS[clave];

  pantallaActual?.salir?.();
  pantallaActual = pantalla.modulo;

  titulo.textContent = pantalla.titulo;
  document.title = `${pantalla.titulo} · Mi Asesora`;
  document.querySelectorAll('.menu a').forEach((enlace) => {
    const activo = enlace.getAttribute('href') === `#${clave}`;
    if (activo) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  });

  contenido.innerHTML = '';
  window.scrollTo(0, 0);
  if (pantalla.modulo) {
    await pantalla.modulo.mostrar(contenido);
  } else {
    contenido.innerHTML = `
      <section class="proximamente">
        <div class="proximamente-icono">✿</div>
        <h2>Muy pronto</h2>
        <p>Estamos preparando esta sección. Por ahora, completa tu perfil para que tu asesora te conozca.</p>
        <a class="boton" href="#perfil">Ir a mi perfil</a>
      </section>`;
  }
}

window.addEventListener('hashchange', mostrarPantalla);
mostrarPantalla();

// Registra el "ayudante" que permite instalar la app y usarla sin internet.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
