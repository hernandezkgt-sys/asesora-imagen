// Pantalla "Asesora": califica un outfit según tus objetivos y te da trucos.
import { leer, guardar, listarPrendas, listarOutfits } from '../almacen.js';
import { dibujarAvatar } from '../avatar/dibujar-avatar.js';
import { categoria, color } from '../closet/catalogo.js';
import { ESTILO_INICIAL, PIEZAS_VACIAS, armarOutfit, outfitVacio } from '../closet/outfits.js';
import { evaluarOutfit } from '../asesoria/reglas.js';
import { OBJETIVOS } from '../asesoria/objetivos.js';
import { PERFIL_INICIAL } from './perfil.js';
import { textoSeguro } from '../ui.js';

// Qué grupos del clóset entran en cada lugar del outfit.
const GRUPOS_RANURA = {
  top: ['arriba'],
  abajo: ['abajo', 'vestidos'],
  capa: ['capas'],
  zapatos: ['zapatos'],
  accesorios: ['complementos'],
};

// Recuerda qué outfit estabas viendo mientras la app siga abierta.
let ultimaEleccion = null;

const ICONO_BIEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>';
const ICONO_MEJORAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l1.6 4.9 4.9 1.6-4.9 1.6L12 16.5l-1.6-4.9L5.5 10l4.9-1.6z"/></svg>';

function nombrePrenda(prenda) {
  if (prenda.nota) return prenda.nota;
  const cat = categoria(prenda.categoria)?.nombre.split(' /')[0] ?? 'Prenda';
  const tono = color(prenda.color)?.nombre.toLowerCase();
  return tono ? `${cat} ${tono}` : cat;
}

// Busca en el clóset una prenda que resuelva la sugerencia.
function candidata(arreglo, estado, piezas) {
  if (arreglo?.tipo !== 'prenda') return null;
  const puestas = new Set([piezas.top, piezas.abajo, piezas.capa, piezas.zapatos, ...piezas.accesorios]);
  return estado.prendas.find((p) =>
    GRUPOS_RANURA[arreglo.ranura].includes(categoria(p.categoria)?.grupo)
    && !puestas.has(p.id)
    && arreglo.filtro(p)) ?? null;
}

function textoObjetivos(objetivos) {
  const principal = OBJETIVOS.find((o) => o.id === objetivos.principal);
  const otros = objetivos.elegidos.length - (principal ? 1 : 0);
  if (principal) return `Prioridad: <b>${principal.nombre}</b>${otros ? ` y ${otros} objetivo${otros > 1 ? 's' : ''} más` : ''}.`;
  return `Según tus ${objetivos.elegidos.length} objetivo${objetivos.elegidos.length > 1 ? 's' : ''}.`;
}

function selector(estado) {
  return `
    <div class="selector-outfits" role="radiogroup" aria-label="Elige un outfit">
      ${estado.opciones.map((o) => `
        <button type="button" class="opcion-outfit" data-elegir="${o.clave}" aria-pressed="${o.clave === estado.elegido}">
          <span class="outfit-mini">${dibujarAvatar(estado.perfil, { id: `sel-${o.clave}`, conRegla: false, outfit: armarOutfit(o.piezas, o.estilo, estado.porId) })}</span>
          <span class="outfit-nombre">${textoSeguro(o.nombre)}</span>
        </button>`).join('')}
    </div>`;
}

function resultado(estado) {
  const opcion = estado.opciones.find((o) => o.clave === estado.elegido);
  const outfit = armarOutfit(opcion.piezas, opcion.estilo, estado.porId);
  const r = evaluarOutfit(outfit, estado.perfil, estado.objetivos);
  estado.mejoras = r.mejoras;

  const etiqueta = (item) => (item.etiqueta ? `<span class="consejo-etiqueta">${item.etiqueta}</span>` : '');

  const favorece = r.favorece.length
    ? `<ul class="consejos">${r.favorece.map((item) => `
        <li class="consejo consejo-bien">
          <span class="consejo-icono">${ICONO_BIEN}</span>
          <div><p>${textoSeguro(item.texto)}</p>${etiqueta(item)}</div>
        </li>`).join('')}</ul>`
    : '<p class="ayuda">Todavía no encontramos algo que juegue a favor de tus objetivos. Mira los trucos de abajo.</p>';

  const mejoras = r.mejoras.length
    ? `<ul class="consejos">${r.mejoras.map((item, i) => {
        const prenda = candidata(item.arreglo, estado, opcion.piezas);
        let accion = '';
        if (item.arreglo?.tipo === 'estilo') {
          accion = `<button type="button" class="boton boton-pequeno" data-arreglo="${i}">${item.arreglo.texto} en el probador</button>`;
        } else if (prenda) {
          accion = `<button type="button" class="boton boton-pequeno" data-arreglo="${i}" data-prenda="${prenda.id}">Probar con ${textoSeguro(nombrePrenda(prenda))}</button>`;
        } else if (item.arreglo?.tipo === 'prenda') {
          accion = '<p class="ayuda">Aún no tienes una prenda así en tu clóset.</p>';
        }
        return `
          <li class="consejo consejo-mejorar">
            <span class="consejo-icono">${ICONO_MEJORAR}</span>
            <div>
              <p>${textoSeguro(item.texto)}</p>
              <p class="truco"><b>Truco:</b> ${textoSeguro(item.truco)}</p>
              ${etiqueta(item)}
              ${accion}
            </div>
          </li>`;
      }).join('')}</ul>`
    : '<p class="ayuda">¡Nada que corregir según tus objetivos! Este outfit está listo.</p>';

  return `
    <section class="tarjeta calificacion">
      <div class="calificacion-avatar">${dibujarAvatar(estado.perfil, { id: 'asesora', conRegla: false, outfit })}</div>
      <div class="calificacion-texto">
        <div class="puntaje" style="--p:${r.puntos}" role="img" aria-label="Calificación ${r.puntos} de 10">
          <span><b>${r.puntos}</b>/10</span>
        </div>
        <p class="frase">${r.frase}</p>
        <p class="ayuda">${r.sinObjetivos ? 'Asesoría general.' : textoObjetivos(estado.objetivos)}</p>
      </div>
    </section>
    ${r.sinObjetivos ? '<p class="aviso-perfil">Elige <a href="#objetivos">tus objetivos</a> para una asesoría hecha a tu medida.</p>' : ''}
    <section class="tarjeta">
      <h2>Lo que te favorece</h2>
      ${favorece}
    </section>
    <section class="tarjeta">
      <h2>Lo que puedes mejorar</h2>
      ${mejoras}
    </section>`;
}

export async function mostrar(destino) {
  const raiz = document.createElement('div');
  raiz.className = 'asesora';
  destino.append(raiz);

  const prendas = await listarPrendas();
  const probador = await leer('probador');
  const outfits = await listarOutfits();
  const estado = {
    perfil: { ...PERFIL_INICIAL, ...(await leer('perfil')) },
    objetivos: { elegidos: [], principal: null, ...(await leer('objetivos')) },
    prendas,
    porId: new Map(prendas.map((p) => [p.id, p])),
    opciones: [],
    elegido: null,
    mejoras: [],
  };

  const piezasProbador = { ...PIEZAS_VACIAS, ...probador?.piezas };
  if (!outfitVacio(piezasProbador)) {
    estado.opciones.push({
      clave: 'probador',
      nombre: 'Probador',
      piezas: piezasProbador,
      estilo: { ...ESTILO_INICIAL, ...probador?.estilo },
      outfitId: probador?.outfitId ?? null,
      nombreOutfit: probador?.nombre ?? '',
    });
  }
  for (const o of outfits.slice().reverse()) {
    estado.opciones.push({
      clave: String(o.id), nombre: o.nombre, piezas: { ...PIEZAS_VACIAS, ...o.piezas },
      estilo: { ...ESTILO_INICIAL, ...o.estilo }, outfitId: o.id, nombreOutfit: o.nombre,
    });
  }

  if (!estado.opciones.length) {
    raiz.innerHTML = `
      <section class="vacio">
        <h2>Aún no hay outfits</h2>
        <p>Arma un outfit en el Probador y tu asesora te dirá qué te favorece y cómo mejorarlo.</p>
        <a class="boton" href="#probador">Ir al probador</a>
      </section>`;
    return;
  }

  estado.elegido = estado.opciones.some((o) => o.clave === ultimaEleccion) ? ultimaEleccion : estado.opciones[0].clave;

  const dibujar = () => {
    raiz.innerHTML = `
      <p class="intro">Elige un outfit y tu asesora te dice qué te favorece y cómo mejorarlo.</p>
      ${selector(estado)}
      <div id="resultado">${resultado(estado)}</div>`;
  };

  raiz.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('[data-elegir], [data-arreglo]');
    if (!boton) return;

    if (boton.dataset.elegir) {
      estado.elegido = boton.dataset.elegir;
      ultimaEleccion = estado.elegido;
      raiz.querySelectorAll('[data-elegir]').forEach((b) => b.setAttribute('aria-pressed', String(b === boton)));
      document.getElementById('resultado').innerHTML = resultado(estado);
      return;
    }

    // Aplica el truco en el Probador y lleva ahí a la persona.
    const item = estado.mejoras[Number(boton.dataset.arreglo)];
    const opcion = estado.opciones.find((o) => o.clave === estado.elegido);
    const piezas = { ...opcion.piezas, accesorios: [...opcion.piezas.accesorios] };
    const estilo = { ...opcion.estilo };
    if (item.arreglo.tipo === 'estilo') {
      Object.assign(estilo, item.arreglo.cambio);
    } else {
      const id = Number(boton.dataset.prenda);
      const ranura = item.arreglo.ranura;
      if (ranura === 'accesorios') piezas.accesorios.push(id);
      else piezas[ranura] = id;
      // Un top nuevo reemplaza al vestido.
      if (ranura === 'top' && estado.porId.get(piezas.abajo)?.categoria === 'vestido') piezas.abajo = null;
    }
    await guardar('probador', { piezas, estilo, outfitId: opcion.outfitId, nombre: opcion.nombreOutfit });
    ultimaEleccion = 'probador';
    location.hash = '#probador';
  });

  dibujar();
}
