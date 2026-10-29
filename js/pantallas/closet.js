// Pantalla "Mi clóset": ver, agregar, editar y borrar prendas.
import { listarPrendas, guardarPrenda, borrarPrenda } from '../almacen.js';
import { GRUPOS, CATEGORIAS, COLORES, categoria, color, camposDe } from '../closet/catalogo.js';
import { reducirFoto, detectarColor } from '../fotos.js';
import { mostrarAviso, textoSeguro } from '../ui.js';

// Direcciones temporales para mostrar fotos guardadas; se liberan al salir.
let urls = [];
function urlDe(blob) {
  const url = URL.createObjectURL(blob);
  urls.push(url);
  return url;
}
function liberarUrls() {
  urls.forEach((url) => URL.revokeObjectURL(url));
  urls = [];
}

// ---------- Piezas de HTML ----------

function muestraColor(c) {
  if (!c) return '<i class="punto-color sin-color"></i>';
  return `<i class="punto-color ${c.id === 'multicolor' ? 'multicolor' : ''}" style="background:${c.hex}"></i>`;
}

function tarjetaPrenda(prenda) {
  const cat = categoria(prenda.categoria);
  const c = color(prenda.color);
  const foto = prenda.miniatura
    ? `<img src="${urlDe(prenda.miniatura)}" alt="">`
    : `<span class="prenda-sin-foto ${c?.id === 'multicolor' ? 'multicolor' : ''}" style="background:${c?.hex ?? 'var(--rosa-suave)'}"></span>`;
  return `
    <button type="button" class="prenda" data-abrir="${prenda.id}">
      <span class="prenda-foto">${foto}</span>
      <span class="prenda-nombre">${textoSeguro(prenda.nota || cat?.nombre || 'Prenda')}</span>
      <span class="prenda-detalle">${muestraColor(c)}${prenda.nota ? cat?.nombre ?? '' : c?.nombre ?? 'Sin color'}</span>
    </button>`;
}

function vistaLista(estado) {
  const { prendas, filtro } = estado;
  const conteo = (grupo) => prendas.filter((p) => categoria(p.categoria)?.grupo === grupo).length;
  const filtros = [
    { id: 'todas', nombre: 'Todas', n: prendas.length },
    ...GRUPOS.map((g) => ({ id: g.id, nombre: g.nombre, n: conteo(g.id) })).filter((g) => g.n > 0),
  ];
  const visibles = filtro === 'todas'
    ? prendas
    : prendas.filter((p) => categoria(p.categoria)?.grupo === filtro);

  const contenido = prendas.length === 0
    ? `<section class="vacio">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.5a2 2 0 1 1 2-2c0 1.2-2 1.6-2 3.2"/><path d="M12 8.7 3 15.5c-.8.6-.4 1.8.6 1.8h16.8c1 0 1.4-1.2.6-1.8L12 8.7z"/></svg>
        <h2>Tu clóset está vacío</h2>
        <p>Agrega tu primera prenda con una foto. Tu asesora la usará para armar y calificar tus outfits.</p>
      </section>`
    : `<div class="filtros" role="radiogroup" aria-label="Filtrar prendas">
        ${filtros.map((f) => `
          <label class="chip">
            <input type="radio" name="filtro" value="${f.id}" ${f.id === filtro ? 'checked' : ''}>
            <span>${f.nombre} <small>${f.n}</small></span>
          </label>`).join('')}
      </div>
      <div class="rejilla-prendas">${[...visibles].reverse().map(tarjetaPrenda).join('')}</div>`;

  return `${contenido}
    <button type="button" class="boton boton-agregar" data-accion="nueva">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
      Agregar prenda
    </button>`;
}

function barraSuperior(texto) {
  return `
    <div class="barra-sub">
      <button type="button" class="boton-volver" data-accion="volver" aria-label="Volver a mi clóset">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <h2>${texto}</h2>
    </div>`;
}

function vistaCategorias(estado) {
  return `
    ${barraSuperior('¿Qué vas a agregar?')}
    ${GRUPOS.map((g) => `
      <section class="grupo-categorias">
        <h3>${g.nombre}</h3>
        <div class="opciones-categoria">
          ${CATEGORIAS.filter((c) => c.grupo === g.id).map((c) => `
            <button type="button" class="opcion-categoria ${estado.borrador?.categoria === c.id ? 'actual' : ''}" data-categoria="${c.id}">${c.nombre}</button>`).join('')}
        </div>
      </section>`).join('')}`;
}

function chipsCampo(campo, cat, valor) {
  return `
    <fieldset class="campo">
      <legend class="etiqueta-campo">${campo.nombre}</legend>
      ${campo.ayuda ? `<p class="ayuda ayuda-arriba">${campo.ayuda}</p>` : ''}
      <div class="chips">
        ${campo.opciones(cat).map((o) => `
          <label class="chip">
            <input type="radio" name="${campo.id}" value="${o.id}" ${o.id === valor ? 'checked' : ''}>
            <span>${o.nombre}</span>
          </label>`).join('')}
      </div>
    </fieldset>`;
}

function vistaFormulario(estado) {
  const { borrador } = estado;
  const cat = categoria(borrador.categoria);
  const elegido = color(borrador.color);
  return `
    ${barraSuperior(borrador.id ? 'Editar prenda' : 'Nueva prenda')}
    <form id="form-prenda" class="formulario" autocomplete="off">
      <section class="tarjeta foto-prenda">
        <div class="foto-prenda-vista">
          ${borrador.foto
            ? `<img src="${urlDe(borrador.foto)}" alt="Foto de la prenda">`
            : '<p>Sin foto todavía</p>'}
        </div>
        <label class="boton" for="foto-prenda">${borrador.foto ? 'Cambiar foto' : 'Tomar o subir foto'}</label>
        <input type="file" id="foto-prenda" accept="image/*" hidden>
        <p class="ayuda" id="color-detectado" aria-live="polite">${estado.avisoColor ?? 'Tip: toma la foto sobre un fondo liso, con la prenda extendida.'}</p>
      </section>

      <section class="tarjeta">
        <div class="tipo-elegido">
          <span class="etiqueta">${cat.nombre}</span>
          <button type="button" class="enlace" data-accion="cambiar-tipo">Cambiar tipo</button>
        </div>

        <div class="campo">
          <label for="nota">Nombre o nota <span class="opcional">(opcional)</span></label>
          <input type="text" id="nota" name="nota" maxlength="40" value="${textoSeguro(borrador.nota ?? '')}" placeholder="Ej. Blusa rosa de lino">
        </div>

        <fieldset class="campo">
          <legend class="etiqueta-campo">Color principal</legend>
          <div class="muestras muestras-prenda">
            ${COLORES.map((c) => `
              <label class="muestra" title="${c.nombre}">
                <input type="radio" name="color" value="${c.id}" ${c.id === borrador.color ? 'checked' : ''} aria-label="${c.nombre}">
                <span class="${c.id === 'multicolor' ? 'multicolor' : ''}" style="background:${c.hex}"></span>
              </label>`).join('')}
          </div>
          <p class="ayuda" id="nombre-color">${elegido?.nombre ?? 'Toca un color'}</p>
        </fieldset>

        ${camposDe(cat).map((campo) => chipsCampo(campo, cat, borrador[campo.id])).join('')}
      </section>

      <div class="acciones-form">
        ${borrador.id ? '<button type="button" class="boton boton-secundario" data-accion="borrar">Borrar</button>' : ''}
        <button type="submit" class="boton">Guardar prenda</button>
      </div>
    </form>`;
}

// ---------- Pantalla ----------

export async function mostrar(destino) {
  // Contenedor propio para que los toques no se acumulen al volver a esta pantalla.
  const raiz = document.createElement('div');
  raiz.className = 'closet';
  destino.append(raiz);

  const estado = {
    vista: 'lista',
    filtro: 'todas',
    prendas: await listarPrendas(),
    borrador: null,
    avisoColor: null,
  };

  const dibujar = () => {
    liberarUrls();
    if (estado.vista === 'categorias') raiz.innerHTML = vistaCategorias(estado);
    else if (estado.vista === 'formulario') raiz.innerHTML = vistaFormulario(estado);
    else raiz.innerHTML = vistaLista(estado);
  };

  const irA = (vista) => {
    estado.vista = vista;
    dibujar();
    window.scrollTo(0, 0);
  };

  // Guarda en el borrador lo que la persona va marcando en el formulario.
  const leerFormulario = (formulario) => {
    const datos = new FormData(formulario);
    estado.borrador.nota = datos.get('nota')?.trim() ?? '';
    estado.borrador.color = datos.get('color') ?? estado.borrador.color;
    for (const campo of camposDe(categoria(estado.borrador.categoria))) {
      const valor = datos.get(campo.id);
      if (valor) estado.borrador[campo.id] = valor;
    }
  };

  // Deja solo los datos que aplican a la categoría elegida.
  const limpiar = (borrador) => {
    const cat = categoria(borrador.categoria);
    const prenda = {
      categoria: borrador.categoria,
      color: borrador.color ?? null,
      nota: borrador.nota ?? '',
      foto: borrador.foto ?? null,
      miniatura: borrador.miniatura ?? null,
      creada: borrador.creada ?? Date.now(),
      actualizada: Date.now(),
    };
    if (borrador.id) prenda.id = borrador.id;
    for (const campo of camposDe(cat)) {
      if (borrador[campo.id]) prenda[campo.id] = borrador[campo.id];
    }
    return prenda;
  };

  raiz.addEventListener('click', async (evento) => {
    const objetivo = evento.target.closest('[data-accion], [data-categoria], [data-abrir]');
    if (!objetivo) return;

    if (objetivo.dataset.abrir) {
      const prenda = estado.prendas.find((p) => p.id === Number(objetivo.dataset.abrir));
      estado.borrador = { ...prenda };
      estado.avisoColor = null;
      irA('formulario');
      return;
    }

    if (objetivo.dataset.categoria) {
      estado.borrador = { ...(estado.borrador ?? {}), categoria: objetivo.dataset.categoria };
      irA('formulario');
      return;
    }

    switch (objetivo.dataset.accion) {
      case 'nueva':
        estado.borrador = null;
        estado.avisoColor = null;
        irA('categorias');
        break;
      case 'cambiar-tipo':
        irA('categorias');
        break;
      case 'volver':
        estado.borrador = null;
        irA('lista');
        break;
      case 'borrar':
        // Pide un segundo toque para no borrar sin querer.
        if (!objetivo.dataset.confirmar) {
          objetivo.dataset.confirmar = 'si';
          objetivo.textContent = 'Sí, borrar';
          objetivo.classList.add('boton-peligro');
          setTimeout(() => {
            if (!objetivo.isConnected) return;
            delete objetivo.dataset.confirmar;
            objetivo.textContent = 'Borrar';
            objetivo.classList.remove('boton-peligro');
          }, 4000);
          return;
        }
        await borrarPrenda(estado.borrador.id);
        estado.prendas = await listarPrendas();
        estado.borrador = null;
        irA('lista');
        mostrarAviso('Prenda borrada');
        break;
    }
  });

  raiz.addEventListener('change', async (evento) => {
    const control = evento.target;

    if (control.name === 'filtro') {
      estado.filtro = control.value;
      dibujar();
      return;
    }

    if (control.id === 'foto-prenda') {
      const archivo = control.files[0];
      if (!archivo) return;
      const aviso = document.getElementById('color-detectado');
      aviso.textContent = 'Revisando la foto…';
      try {
        leerFormulario(control.form);
        const [foto, miniatura] = await Promise.all([
          reducirFoto(archivo, 1200),
          reducirFoto(archivo, 400, 0.8),
        ]);
        estado.borrador.foto = foto;
        estado.borrador.miniatura = miniatura;
        const detectado = await detectarColor(miniatura, COLORES);
        if (detectado && !estado.borrador.color) {
          estado.borrador.color = detectado.id;
          estado.avisoColor = `Elegimos ${detectado.nombre} según tu foto. Si no es correcto, toca otro color.`;
        } else if (detectado && detectado.id !== estado.borrador.color) {
          estado.avisoColor = `La foto parece ${detectado.nombre}. Si es así, cambia el color abajo.`;
        } else {
          estado.avisoColor = null;
        }
        dibujar();
      } catch {
        aviso.textContent = 'No pudimos abrir esa foto. Prueba con otra.';
      }
    }
  });

  raiz.addEventListener('input', (evento) => {
    const formulario = evento.target.form;
    if (formulario?.id !== 'form-prenda') return;
    leerFormulario(formulario);
    if (evento.target.name === 'color') {
      document.getElementById('nombre-color').textContent = color(estado.borrador.color)?.nombre ?? '';
    }
  });

  raiz.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    leerFormulario(evento.target);
    const boton = evento.target.querySelector('[type="submit"]');
    boton.disabled = true;
    try {
      const nueva = !estado.borrador.id;
      await guardarPrenda(limpiar(estado.borrador));
      estado.prendas = await listarPrendas();
      estado.borrador = null;
      irA('lista');
      mostrarAviso(nueva ? 'Prenda agregada a tu clóset' : 'Cambios guardados');
    } catch {
      boton.disabled = false;
      mostrarAviso('No se pudo guardar. Revisa que tu teléfono tenga espacio.');
    }
  });

  dibujar();
}

export function salir() {
  liberarUrls();
}
