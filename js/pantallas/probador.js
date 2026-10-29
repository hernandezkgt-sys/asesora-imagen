// Pantalla "Probador": vestir el avatar con prendas del clóset y guardar outfits.
import { leer, guardar, listarPrendas, listarOutfits, guardarOutfit, borrarOutfit } from '../almacen.js';
import { dibujarAvatar } from '../avatar/dibujar-avatar.js';
import { categoria, color } from '../closet/catalogo.js';
import { PERFIL_INICIAL } from './perfil.js';
import { mostrarAviso, textoSeguro } from '../ui.js';

const CARRILES = [
  { id: 'top', nombre: 'Tops', grupos: ['arriba'] },
  { id: 'abajo', nombre: 'Abajo y vestidos', grupos: ['abajo', 'vestidos'] },
  { id: 'capa', nombre: 'Capas', grupos: ['capas'] },
  { id: 'zapatos', nombre: 'Zapatos', grupos: ['zapatos'] },
  { id: 'accesorios', nombre: 'Accesorios y bolsas', grupos: ['complementos'], varios: true },
];

const ESTILO_INICIAL = { fajar: 'suelta', capa: 'abierta', mangas: 'normales' };
const PIEZAS_VACIAS = { top: null, abajo: null, capa: null, zapatos: null, accesorios: [] };

let urls = [];
function urlDe(blob) {
  const url = URL.createObjectURL(blob);
  urls.push(url);
  return url;
}

// Convierte los números de prenda guardados en las prendas completas.
function armarOutfit(piezas, estilo, porId) {
  return {
    top: porId.get(piezas.top) ?? null,
    abajo: porId.get(piezas.abajo) ?? null,
    capa: porId.get(piezas.capa) ?? null,
    zapatos: porId.get(piezas.zapatos) ?? null,
    accesorios: piezas.accesorios.map((id) => porId.get(id)).filter(Boolean),
    estilo,
  };
}

// ---------- Piezas de HTML ----------

function miniatura(prenda, carril, elegida) {
  const cat = categoria(prenda.categoria);
  const c = color(prenda.color);
  const tipo = carril.varios ? 'checkbox' : 'radio';
  const imagen = prenda.miniatura
    ? `<img src="${urlDe(prenda.miniatura)}" alt="">`
    : `<i class="${c?.id === 'multicolor' ? 'multicolor' : ''}" style="background:${c?.hex ?? 'var(--rosa-suave)'}"></i>`;
  return `
    <label class="miniatura">
      <input type="${tipo}" name="${carril.id}" value="${prenda.id}" ${elegida ? 'checked' : ''}>
      <span class="miniatura-foto">${imagen}</span>
      <small>${textoSeguro(prenda.nota || cat?.nombre || '')}</small>
    </label>`;
}

function carriles(estado) {
  return CARRILES.map((carril) => {
    const prendas = estado.prendas
      .filter((p) => carril.grupos.includes(categoria(p.categoria)?.grupo))
      .reverse();
    const actual = estado.piezas[carril.id];
    const elegida = (p) => (carril.varios ? actual.includes(p.id) : actual === p.id);
    const ninguna = carril.varios ? '' : `
      <label class="miniatura">
        <input type="radio" name="${carril.id}" value="" ${actual ? '' : 'checked'}>
        <span class="miniatura-foto miniatura-ninguna">Nada</span>
        <small>&nbsp;</small>
      </label>`;
    return `
      <section class="carril" aria-label="${carril.nombre}">
        <h3>${carril.nombre}</h3>
        ${prendas.length
          ? `<div class="carril-prendas">${ninguna}${prendas.map((p) => miniatura(p, carril, elegida(p))).join('')}</div>`
          : '<p class="ayuda carril-vacio">Aún no tienes. <a href="#closet">Agrégalas en tu clóset</a>.</p>'}
      </section>`;
  }).join('');
}

function opcionesEstilo(nombre, titulo, opciones, valor) {
  return `
    <fieldset class="campo">
      <legend class="etiqueta-campo">${titulo}</legend>
      <div class="chips">
        ${opciones.map(([id, texto]) => `
          <label class="chip">
            <input type="radio" name="${nombre}" value="${id}" ${id === valor ? 'checked' : ''}>
            <span>${texto}</span>
          </label>`).join('')}
      </div>
    </fieldset>`;
}

// Solo muestra las opciones de estilismo que tienen sentido con lo que lleva puesto.
function estilismo(outfit) {
  const { top, abajo, capa, estilo } = outfit;
  const partes = [];
  if (top && abajo && abajo.categoria !== 'vestido' && top.largo !== 'crop') {
    partes.push(opcionesEstilo('fajar', 'Fajar el top', [['suelta', 'Suelto'], ['frente', 'Solo al frente'], ['completa', 'Completo']], estilo.fajar));
  }
  if (capa && capa.cierre !== 'abierta') {
    partes.push(opcionesEstilo('estiloCapa', 'Capa', [['abierta', 'Abierta'], ['cerrada', 'Cerrada']], estilo.capa));
  }
  const mangaLarga = (prenda, defecto) => ['larga', 'tres-cuartos'].includes(prenda?.manga ?? defecto);
  if (mangaLarga(top) || (capa && mangaLarga(capa, 'larga'))) {
    partes.push(opcionesEstilo('mangas', 'Mangas', [['normales', 'Normales'], ['dobladas', 'Dobladas']], estilo.mangas));
  }
  if (!partes.length) return '';
  return `<section class="tarjeta"><h2>Estilismo</h2>${partes.join('')}</section>`;
}

function seccionGuardar(estado) {
  const vacio = Object.values(estado.piezas).every((v) => (Array.isArray(v) ? !v.length : !v));
  if (vacio) return '';
  return `
    <section class="tarjeta">
      <h2>${estado.outfitId ? 'Este outfit' : 'Guardar outfit'}</h2>
      <div class="campo">
        <label for="nombre-outfit">Nombre</label>
        <input type="text" id="nombre-outfit" maxlength="40" value="${textoSeguro(estado.nombre)}" placeholder="Ej. Lunes de oficina">
      </div>
      <div class="botones-outfit">
        <button type="button" class="boton" data-accion="guardar">${estado.outfitId ? 'Guardar cambios' : 'Guardar outfit'}</button>
        ${estado.outfitId ? `
          <button type="button" class="boton boton-secundario" data-accion="copia">Guardar como nuevo</button>
          <button type="button" class="boton boton-secundario" data-accion="borrar">Borrar</button>` : ''}
      </div>
    </section>`;
}

function misOutfits(estado) {
  if (!estado.outfits.length) return '';
  return `
    <section class="mis-outfits">
      <h2>Mis outfits</h2>
      <div class="rejilla-outfits">
        ${estado.outfits.slice().reverse().map((o) => `
          <button type="button" class="outfit-guardado ${o.id === estado.outfitId ? 'actual' : ''}" data-cargar="${o.id}">
            <span class="outfit-mini">${dibujarAvatar(estado.perfil, {
              id: `mini-${o.id}`, conRegla: false, outfit: armarOutfit(o.piezas, o.estilo, estado.porId),
            })}</span>
            <span class="outfit-nombre">${textoSeguro(o.nombre)}</span>
          </button>`).join('')}
      </div>
    </section>`;
}

// ---------- Pantalla ----------

export async function mostrar(destino) {
  const raiz = document.createElement('div');
  raiz.className = 'probador';
  destino.append(raiz);

  const prendas = await listarPrendas();
  const guardado = await leer('probador');
  const estado = {
    perfil: { ...PERFIL_INICIAL, ...(await leer('perfil')) },
    prendas,
    porId: new Map(prendas.map((p) => [p.id, p])),
    outfits: await listarOutfits(),
    piezas: { ...PIEZAS_VACIAS, ...guardado?.piezas },
    estilo: { ...ESTILO_INICIAL, ...guardado?.estilo },
    outfitId: guardado?.outfitId ?? null,
    nombre: guardado?.nombre ?? '',
  };
  // Quita prendas que ya no existen en el clóset.
  for (const clave of ['top', 'abajo', 'capa', 'zapatos']) {
    if (!estado.porId.has(estado.piezas[clave])) estado.piezas[clave] = null;
  }
  estado.piezas.accesorios = estado.piezas.accesorios.filter((id) => estado.porId.has(id));

  const outfitActual = () => armarOutfit(estado.piezas, estado.estilo, estado.porId);

  const recordar = () => guardar('probador', {
    piezas: estado.piezas, estilo: estado.estilo, outfitId: estado.outfitId, nombre: estado.nombre,
  });

  // Actualiza lo que cambia al vestir (sin redibujar los carriles de fotos).
  const actualizar = () => {
    document.getElementById('avatar-probador').innerHTML = dibujarAvatar(estado.perfil, { id: 'probador', outfit: outfitActual() });
    const nombre = estado.outfitId ? estado.nombre || 'Outfit guardado' : 'Outfit nuevo';
    document.getElementById('nombre-outfit-actual').textContent = nombre;
    document.getElementById('estilismo').innerHTML = estilismo(outfitActual());
    document.getElementById('guardar-outfit').innerHTML = seccionGuardar(estado);
    document.getElementById('mis-outfits').innerHTML = misOutfits(estado);
    recordar();
  };

  const dibujarTodo = () => {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls = [];
    raiz.innerHTML = `
      <section class="tarjeta-avatar">
        <div class="vista-avatar vista-probador"><div class="avatar" id="avatar-probador"></div></div>
        <p class="resumen-avatar">
          <span class="etiqueta" id="nombre-outfit-actual"></span>
          <button type="button" class="enlace" data-accion="limpiar">Quitar todo</button>
        </p>
      </section>
      ${estado.prendas.length ? '' : `
        <section class="vacio">
          <h2>Tu clóset está vacío</h2>
          <p>Agrega prendas en tu clóset para probarlas aquí en tu avatar.</p>
          <a class="boton" href="#closet">Ir a mi clóset</a>
        </section>`}
      <form id="carriles" class="carriles" autocomplete="off">${estado.prendas.length ? carriles(estado) : ''}</form>
      <form id="estilismo" autocomplete="off"></form>
      <div id="guardar-outfit"></div>
      <div id="mis-outfits"></div>`;
    actualizar();
  };

  const nuevoOutfit = () => {
    estado.outfitId = null;
    estado.nombre = '';
  };

  raiz.addEventListener('change', (evento) => {
    const { name, value, checked } = evento.target;
    const carril = CARRILES.find((c) => c.id === name);

    if (carril?.varios) {
      const id = Number(value);
      estado.piezas.accesorios = checked
        ? [...estado.piezas.accesorios, id]
        : estado.piezas.accesorios.filter((x) => x !== id);
    } else if (carril) {
      const id = value ? Number(value) : null;
      estado.piezas[name] = id;
      // Un vestido reemplaza al top, y un top reemplaza al vestido.
      const esVestido = (pid) => estado.porId.get(pid)?.categoria === 'vestido';
      if (name === 'abajo' && esVestido(id) && estado.piezas.top) {
        estado.piezas.top = null;
        raiz.querySelector('input[name="top"][value=""]').checked = true;
        mostrarAviso('El vestido reemplaza al top');
      }
      if (name === 'top' && id && esVestido(estado.piezas.abajo)) {
        estado.piezas.abajo = null;
        raiz.querySelector('input[name="abajo"][value=""]').checked = true;
        mostrarAviso('El top reemplaza al vestido');
      }
    } else if (name === 'fajar') {
      estado.estilo.fajar = value;
    } else if (name === 'estiloCapa') {
      estado.estilo.capa = value;
    } else if (name === 'mangas') {
      estado.estilo.mangas = value;
    } else {
      return;
    }
    actualizar();
  });

  raiz.addEventListener('input', (evento) => {
    if (evento.target.id === 'nombre-outfit') {
      estado.nombre = evento.target.value;
      recordar();
    }
  });

  raiz.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('[data-accion], [data-cargar]');
    if (!boton) return;

    if (boton.dataset.cargar) {
      const outfit = estado.outfits.find((o) => o.id === Number(boton.dataset.cargar));
      estado.piezas = { ...PIEZAS_VACIAS, ...outfit.piezas };
      estado.estilo = { ...ESTILO_INICIAL, ...outfit.estilo };
      estado.outfitId = outfit.id;
      estado.nombre = outfit.nombre;
      dibujarTodo();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    switch (boton.dataset.accion) {
      case 'limpiar':
        estado.piezas = { ...PIEZAS_VACIAS, accesorios: [] };
        estado.estilo = { ...ESTILO_INICIAL };
        nuevoOutfit();
        dibujarTodo();
        break;
      case 'copia':
        // Olvida cuál outfit estaba abierto y lo guarda como uno nuevo.
        nuevoOutfit();
      // falls through
      case 'guardar': {
        const nombre = document.getElementById('nombre-outfit').value.trim();
        const outfit = {
          nombre: nombre || `Outfit ${estado.outfits.length + 1}`,
          piezas: estado.piezas,
          estilo: estado.estilo,
          actualizado: Date.now(),
        };
        if (estado.outfitId) {
          outfit.id = estado.outfitId;
          outfit.creado = estado.outfits.find((o) => o.id === estado.outfitId)?.creado;
        } else {
          outfit.creado = Date.now();
        }
        estado.outfitId = await guardarOutfit(outfit);
        estado.nombre = outfit.nombre;
        estado.outfits = await listarOutfits();
        actualizar();
        mostrarAviso(`"${outfit.nombre}" guardado`);
        break;
      }
      case 'borrar':
        if (!boton.dataset.confirmar) {
          boton.dataset.confirmar = 'si';
          boton.textContent = 'Sí, borrar';
          boton.classList.add('boton-peligro');
          return;
        }
        await borrarOutfit(estado.outfitId);
        estado.outfits = await listarOutfits();
        nuevoOutfit();
        actualizar();
        mostrarAviso('Outfit borrado');
        break;
    }
  });

  dibujarTodo();
}

export function salir() {
  urls.forEach((url) => URL.revokeObjectURL(url));
  urls = [];
}
