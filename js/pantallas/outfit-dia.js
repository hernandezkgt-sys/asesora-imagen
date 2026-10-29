// Pantalla "Mi día": outfit de hoy, planear la semana y favoritos.
import { leer, guardar, listarPrendas, listarOutfits, guardarOutfit } from '../almacen.js';
import { dibujarAvatar } from '../avatar/dibujar-avatar.js';
import { ESTILO_INICIAL, PIEZAS_VACIAS, armarOutfit } from '../closet/outfits.js';
import { evaluarOutfit } from '../asesoria/reglas.js';
import { PERFIL_INICIAL } from './perfil.js';
import { mostrarAviso, textoSeguro } from '../ui.js';

const DIAS_SEMANA = 7;
const DIAS_QUE_SE_GUARDAN = 60;

// Fecha local como texto "2026-10-29", para usarla de llave en el plan.
export function claveDia(fecha = new Date()) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sumarDias(fecha, dias) {
  const nueva = new Date(fecha);
  nueva.setDate(nueva.getDate() + dias);
  return nueva;
}

const nombreDia = (fecha) => new Intl.DateTimeFormat('es', { weekday: 'short' }).format(fecha).replace('.', '');
const fechaLarga = (fecha) => new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(fecha);

function etiquetaDia(indice, fecha) {
  if (indice === 0) return 'Hoy';
  if (indice === 1) return 'Mañana';
  return fechaLarga(fecha).replace(/^./, (l) => l.toUpperCase());
}

// Borra del plan los días que ya pasaron hace mucho.
function limpiarPlan(plan) {
  const limite = claveDia(sumarDias(new Date(), -DIAS_QUE_SE_GUARDAN));
  return Object.fromEntries(Object.entries(plan).filter(([dia]) => dia >= limite));
}

const CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

// ---------- Pantalla ----------

export async function mostrar(destino) {
  const raiz = document.createElement('div');
  raiz.className = 'mi-dia';
  destino.append(raiz);

  const prendas = await listarPrendas();
  const estado = {
    perfil: { ...PERFIL_INICIAL, ...(await leer('perfil')) },
    objetivos: { elegidos: [], principal: null, ...(await leer('objetivos')) },
    porId: new Map(prendas.map((p) => [p.id, p])),
    outfits: await listarOutfits(),
    plan: (await leer('plan')) ?? {},
    diaElegido: null,
    soloFavoritos: false,
  };

  const hoy = new Date();
  const semana = Array.from({ length: DIAS_SEMANA }, (_, i) => {
    const fecha = sumarDias(hoy, i);
    return { indice: i, fecha, clave: claveDia(fecha) };
  });

  const outfitPorId = (id) => estado.outfits.find((o) => o.id === id);
  const outfitDelDia = (clave) => outfitPorId(estado.plan[clave]);
  const prendasDe = (o) => armarOutfit(o.piezas, o.estilo, estado.porId);
  const puntos = (o) => evaluarOutfit(prendasDe(o), estado.perfil, estado.objetivos).puntos;
  const mini = (o, id) => dibujarAvatar(estado.perfil, { id, conRegla: false, outfit: prendasDe(o) });

  // ---------- Partes de la pantalla ----------

  const tarjetaDia = (dia) => {
    const outfit = outfitDelDia(dia.clave);
    const titulo = dia.indice === 0 ? 'Hoy te toca' : 'Mañana te toca';
    if (!outfit) {
      return `
        <section class="tarjeta dia-destacado dia-vacio">
          <div>
            <h2>${dia.indice === 0 ? '¿Qué te pones hoy?' : 'Planea mañana'}</h2>
            <p class="ayuda">${dia.indice === 0 ? 'Elige uno de tus outfits para hoy.' : 'Déjalo listo desde hoy y ahórrate la prisa.'}</p>
          </div>
          <button type="button" class="boton" data-planear="${dia.clave}">Elegir outfit</button>
        </section>`;
    }
    const p = puntos(outfit);
    return `
      <section class="tarjeta dia-destacado">
        <div class="dia-avatar">${mini(outfit, `dia-${dia.clave}`)}</div>
        <div class="dia-texto">
          <p class="dia-eyebrow">${titulo}</p>
          <h2>${textoSeguro(outfit.nombre)}</h2>
          <span class="insignia-puntos">${p}/10</span>
          <div class="dia-botones">
            <button type="button" class="boton boton-pequeno" data-probar="${outfit.id}">Ver en el probador</button>
            <button type="button" class="enlace" data-planear="${dia.clave}">Cambiar</button>
          </div>
        </div>
      </section>`;
  };

  const tiraSemana = () => `
    <section class="semana" aria-label="Tu semana">
      <h2>Tu semana</h2>
      <div class="dias">
        ${semana.map((dia) => {
          const outfit = outfitDelDia(dia.clave);
          return `
            <button type="button" class="dia ${dia.clave === estado.diaElegido ? 'elegido' : ''}" data-planear="${dia.clave}"
              aria-label="${etiquetaDia(dia.indice, dia.fecha)}: ${outfit ? textoSeguro(outfit.nombre) : 'sin outfit'}">
              <span class="dia-nombre">${dia.indice === 0 ? 'Hoy' : nombreDia(dia.fecha)}</span>
              <span class="dia-numero">${dia.fecha.getDate()}</span>
              <span class="dia-mini">${outfit ? mini(outfit, `sem-${dia.clave}`) : '<i class="mas">+</i>'}</span>
            </button>`;
        }).join('')}
      </div>
    </section>`;

  // Aviso cariñoso si un outfit se repite mucho en la semana.
  const avisoRepetidos = () => {
    const cuenta = new Map();
    for (const dia of semana) {
      const id = estado.plan[dia.clave];
      if (outfitPorId(id)) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
    }
    const [id, veces] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
    if (!veces || veces < 3) return '';
    const otros = estado.outfits.length - cuenta.size;
    return `
      <p class="aviso-suave">
        Repites <b>${textoSeguro(outfitPorId(id).nombre)}</b> ${veces} veces esta semana.
        ${otros > 0 ? `Tienes ${otros} outfit${otros > 1 ? 's' : ''} más esperando su turno. ¿Rotamos?` : 'Arma uno nuevo en el Probador para rotar tu clóset.'}
      </p>`;
  };

  const tarjetaOutfit = (o, { elegible }) => `
    <div class="outfit-dia ${elegible && estado.plan[estado.diaElegido] === o.id ? 'actual' : ''}">
      <button type="button" class="outfit-dia-boton" ${elegible ? `data-elegir="${o.id}"` : `data-probar="${o.id}"`}>
        <span class="outfit-mini">${mini(o, `${elegible ? 'eleg' : 'fav'}-${o.id}`)}</span>
        <span class="outfit-nombre">${textoSeguro(o.nombre)}</span>
        <span class="insignia-puntos">${puntos(o)}/10</span>
      </button>
      <button type="button" class="corazon" data-favorito="${o.id}" aria-pressed="${Boolean(o.favorito)}"
        aria-label="${o.favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}">${CORAZON}</button>
    </div>`;

  // Lista para elegir el outfit del día seleccionado.
  const elegirOutfit = () => {
    if (!estado.diaElegido) return '';
    const dia = semana.find((d) => d.clave === estado.diaElegido);
    const lista = estado.outfits
      .filter((o) => !estado.soloFavoritos || o.favorito)
      .sort((a, b) => Number(Boolean(b.favorito)) - Number(Boolean(a.favorito)) || puntos(b) - puntos(a));
    return `
      <section class="tarjeta elegir-outfit" id="elegir-outfit">
        <div class="elegir-encabezado">
          <h2>${etiquetaDia(dia.indice, dia.fecha)}</h2>
          <button type="button" class="enlace" data-cerrar>Cerrar</button>
        </div>
        <div class="chips">
          <label class="chip"><input type="radio" name="filtro-dia" value="todos" ${estado.soloFavoritos ? '' : 'checked'}><span>Todos</span></label>
          <label class="chip"><input type="radio" name="filtro-dia" value="favoritos" ${estado.soloFavoritos ? 'checked' : ''}><span>Favoritos</span></label>
        </div>
        ${lista.length
          ? `<div class="rejilla-outfits">${lista.map((o) => tarjetaOutfit(o, { elegible: true })).join('')}</div>`
          : '<p class="ayuda">Aún no marcas favoritos. Toca el corazón de un outfit.</p>'}
        ${estado.plan[estado.diaElegido] ? '<button type="button" class="boton boton-secundario quitar-dia" data-quitar>Dejar este día libre</button>' : ''}
      </section>`;
  };

  const favoritos = () => {
    const lista = estado.outfits.filter((o) => o.favorito);
    return `
      <section class="favoritos">
        <h2>Mis favoritos</h2>
        ${lista.length
          ? `<div class="rejilla-outfits">${lista.map((o) => tarjetaOutfit(o, { elegible: false })).join('')}</div>`
          : '<p class="ayuda">Toca el corazón de un outfit para guardarlo aquí.</p>'}
      </section>`;
  };

  const dibujar = () => {
    if (!estado.outfits.length) {
      raiz.innerHTML = `
        <section class="vacio">
          <h2>Aún no tienes outfits</h2>
          <p>Arma y guarda outfits en el Probador para planear qué ponerte cada día.</p>
          <a class="boton" href="#probador">Ir al probador</a>
        </section>`;
      return;
    }
    raiz.innerHTML = `
      ${tarjetaDia(semana[0])}
      ${tarjetaDia(semana[1])}
      ${tiraSemana()}
      ${avisoRepetidos()}
      ${elegirOutfit()}
      ${favoritos()}`;
  };

  const guardarPlan = () => {
    estado.plan = limpiarPlan(estado.plan);
    return guardar('plan', estado.plan);
  };

  // ---------- Toques ----------

  raiz.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('[data-planear], [data-elegir], [data-probar], [data-favorito], [data-cerrar], [data-quitar]');
    if (!boton) return;
    const { dataset } = boton;

    if (dataset.planear) {
      estado.diaElegido = dataset.planear;
      dibujar();
      document.getElementById('elegir-outfit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (dataset.cerrar !== undefined) {
      estado.diaElegido = null;
      dibujar();
    } else if (dataset.elegir) {
      const outfit = outfitPorId(Number(dataset.elegir));
      const dia = semana.find((d) => d.clave === estado.diaElegido);
      estado.plan[estado.diaElegido] = outfit.id;
      estado.diaElegido = null;
      await guardarPlan();
      dibujar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const cuando = dia.indice === 0 ? 'hoy' : dia.indice === 1 ? 'mañana' : `el ${fechaLarga(dia.fecha).replace(',', '')}`;
      mostrarAviso(`Listo para ${cuando}`);
    } else if (dataset.quitar !== undefined) {
      delete estado.plan[estado.diaElegido];
      estado.diaElegido = null;
      await guardarPlan();
      dibujar();
    } else if (dataset.favorito) {
      const outfit = outfitPorId(Number(dataset.favorito));
      outfit.favorito = !outfit.favorito;
      await guardarOutfit(outfit);
      dibujar();
      mostrarAviso(outfit.favorito ? 'Agregado a favoritos' : 'Quitado de favoritos');
    } else if (dataset.probar) {
      const outfit = outfitPorId(Number(dataset.probar));
      await guardar('probador', {
        piezas: { ...PIEZAS_VACIAS, ...outfit.piezas },
        estilo: { ...ESTILO_INICIAL, ...outfit.estilo },
        outfitId: outfit.id,
        nombre: outfit.nombre,
      });
      location.hash = '#probador';
    }
  });

  raiz.addEventListener('change', (evento) => {
    if (evento.target.name !== 'filtro-dia') return;
    estado.soloFavoritos = evento.target.value === 'favoritos';
    dibujar();
  });

  dibujar();
}
