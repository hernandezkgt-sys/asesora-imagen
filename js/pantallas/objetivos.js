// Pantalla "Mis objetivos": la persona elige qué quiere lograr con su imagen.
import { leer, guardar } from '../almacen.js';
import { OBJETIVOS, sugerenciasPara } from '../asesoria/objetivos.js';
import { mostrarAviso } from '../ui.js';

const ESTRELLA = '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>';

function tarjeta(objetivo, { elegido, principal, sugerencia }) {
  return `
    <article class="objetivo ${elegido ? 'elegido' : ''}" data-id="${objetivo.id}">
      <label class="objetivo-cabecera">
        <input type="checkbox" name="objetivo" value="${objetivo.id}" ${elegido ? 'checked' : ''}>
        <span class="objetivo-icono"><svg viewBox="0 0 24 24" aria-hidden="true">${objetivo.icono}</svg></span>
        <span class="objetivo-texto">
          <strong>${objetivo.nombre}</strong>
          <span>${objetivo.descripcion}</span>
          ${sugerencia ? `<span class="sugerido">Sugerido para ti · ${sugerencia}</span>` : ''}
        </span>
        <span class="casilla" aria-hidden="true"></span>
      </label>
      <div class="objetivo-detalle" ${elegido ? '' : 'hidden'}>
        <p class="tip"><b>Tip:</b> ${objetivo.tip}</p>
        <button type="button" class="boton-principal" data-principal="${objetivo.id}" aria-pressed="${principal}">
          <svg viewBox="0 0 24 24" aria-hidden="true">${ESTRELLA}</svg>
          ${principal ? 'Mi objetivo principal' : 'Hacerlo principal'}
        </button>
      </div>
    </article>`;
}

function resumen(estado) {
  if (!estado.elegidos.length) {
    return 'Toca los objetivos que quieras lograr. Puedes elegir varios.';
  }
  const principal = OBJETIVOS.find((o) => o.id === estado.principal);
  const cuantos = estado.elegidos.length === 1 ? '1 objetivo' : `${estado.elegidos.length} objetivos`;
  return principal
    ? `${cuantos}. Tu prioridad: <b>${principal.nombre}</b>.`
    : `${cuantos}. Marca uno con ★ para que la Asesora le dé prioridad.`;
}

export async function mostrar(destino) {
  // Contenedor propio para que los toques no se acumulen al volver a esta pantalla.
  const contenedor = document.createElement('div');
  destino.append(contenedor);
  const perfil = await leer('perfil');
  const estado = { elegidos: [], principal: null, ...(await leer('objetivos')) };
  const sugerencias = sugerenciasPara(perfil);

  // Primero los sugeridos, luego el resto (en su orden original).
  const ordenados = [...OBJETIVOS].sort((a, b) => Boolean(sugerencias[b.id]) - Boolean(sugerencias[a.id]));

  const dibujar = () => {
    contenedor.innerHTML = `
      <p class="intro">Elige lo que quieres lograr. Tu asesora usará esto para decirte qué te favorece.</p>
      <p class="resumen-objetivos" aria-live="polite">${resumen(estado)}</p>
      ${perfil ? '' : '<p class="aviso-perfil">Completa <a href="#perfil">tu perfil</a> para recibir sugerencias personalizadas.</p>'}
      <div class="objetivos">
        ${ordenados.map((o) => tarjeta(o, {
          elegido: estado.elegidos.includes(o.id),
          principal: estado.principal === o.id,
          sugerencia: sugerencias[o.id],
        })).join('')}
      </div>`;
  };

  const guardarEstado = async (mensaje) => {
    await guardar('objetivos', estado);
    if (mensaje) mostrarAviso(mensaje);
  };

  // Redibuja sin perder la posición de la pantalla.
  const actualizar = (mensaje) => {
    const posicion = window.scrollY;
    const enfocado = document.activeElement?.closest('[data-id]')?.dataset.id;
    const enBotonPrincipal = Boolean(document.activeElement?.dataset.principal);
    dibujar();
    window.scrollTo(0, posicion);
    if (enfocado) {
      const tarjeta = contenedor.querySelector(`[data-id="${enfocado}"]`);
      tarjeta?.querySelector(enBotonPrincipal ? '[data-principal]' : 'input')?.focus({ preventScroll: true });
    }
    guardarEstado(mensaje);
  };

  contenedor.addEventListener('change', (evento) => {
    if (evento.target.name !== 'objetivo') return;
    const { value, checked } = evento.target;
    estado.elegidos = checked
      ? [...estado.elegidos, value]
      : estado.elegidos.filter((id) => id !== value);
    if (!checked && estado.principal === value) estado.principal = null;
    actualizar();
  });

  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-principal]');
    if (!boton) return;
    const id = boton.dataset.principal;
    estado.principal = estado.principal === id ? null : id;
    actualizar(estado.principal ? '★ Objetivo principal guardado' : null);
  });

  dibujar();
}
