// Pantalla "Mi perfil": foto de referencia, medidas y avatar en vivo.
import { leer, guardar, borrar } from '../almacen.js';
import { dibujarAvatar } from '../avatar/dibujar-avatar.js';
import { caminoRostro, formaRostro } from '../avatar/partes.js';
import { mostrarAviso, textoSeguro } from '../ui.js';
import { reducirFoto } from '../fotos.js';

export const PERFIL_INICIAL = {
  nombre: '',
  estatura: 160,
  peso: 58,
  busto: 'mediano',
  cadera: 'proporcional',
  rostro: 'ovalado',
  piel: '#E3A985',
  cabelloColor: '#3B2A20',
  cabelloLargo: 'hombros',
};

const BUSTOS = [
  { id: 'pequeno', nombre: 'Pequeño' },
  { id: 'mediano', nombre: 'Mediano' },
  { id: 'grande', nombre: 'Grande' },
];

const CADERAS = [
  { id: 'estrecha', nombre: 'Estrecha', ayuda: 'Más angosta que tus hombros' },
  { id: 'proporcional', nombre: 'Proporcional', ayuda: 'Casi igual que tus hombros' },
  { id: 'amplia', nombre: 'Amplia', ayuda: 'Más ancha que tus hombros' },
];

const ROSTROS = [
  { id: 'ovalado', nombre: 'Ovalado' },
  { id: 'redondo', nombre: 'Redondo' },
  { id: 'cuadrado', nombre: 'Cuadrado' },
  { id: 'corazon', nombre: 'Corazón' },
  { id: 'alargado', nombre: 'Alargado' },
  { id: 'diamante', nombre: 'Diamante' },
];

const TONOS_PIEL = [
  { color: '#FDE7D9', nombre: 'Porcelana' },
  { color: '#F7D4BC', nombre: 'Marfil' },
  { color: '#EFC0A0', nombre: 'Beige claro' },
  { color: '#E3A985', nombre: 'Beige' },
  { color: '#D29672', nombre: 'Miel' },
  { color: '#BB7B58', nombre: 'Canela' },
  { color: '#A06446', nombre: 'Caramelo' },
  { color: '#844F37', nombre: 'Moka' },
  { color: '#683C2A', nombre: 'Cacao' },
  { color: '#4B2A1E', nombre: 'Ébano' },
];

const COLORES_CABELLO = [
  { color: '#1F1A17', nombre: 'Negro' },
  { color: '#3B2A20', nombre: 'Castaño oscuro' },
  { color: '#5A3C2A', nombre: 'Castaño' },
  { color: '#7B5536', nombre: 'Castaño claro' },
  { color: '#A27B4F', nombre: 'Rubio oscuro' },
  { color: '#D2B072', nombre: 'Rubio' },
  { color: '#E9D9B0', nombre: 'Rubio platino' },
  { color: '#B5652E', nombre: 'Cobrizo' },
  { color: '#A4492A', nombre: 'Pelirrojo' },
  { color: '#BDB8B3', nombre: 'Canoso' },
];

const LARGOS_CABELLO = [
  { id: 'corto', nombre: 'Corto' },
  { id: 'barbilla', nombre: 'A la barbilla' },
  { id: 'hombros', nombre: 'A los hombros' },
  { id: 'media', nombre: 'Media espalda' },
  { id: 'largo', nombre: 'Largo' },
];

const LIMITES = {
  estatura: { min: 135, max: 195, unidad: 'cm' },
  peso: { min: 35, max: 150, unidad: 'kg' },
};

let urlFoto;

// ---------- Plantillas (el HTML de cada parte) ----------

function chips(nombre, opciones, elegido) {
  return `<div class="chips">${opciones.map((o) => `
    <label class="chip">
      <input type="radio" name="${nombre}" value="${o.id}" ${o.id === elegido ? 'checked' : ''}>
      <span>${o.nombre}</span>
    </label>`).join('')}</div>`;
}

function muestras(nombre, opciones, elegido) {
  return `<div class="muestras">${opciones.map((o) => `
    <label class="muestra" title="${o.nombre}">
      <input type="radio" name="${nombre}" value="${o.color}" ${o.color === elegido ? 'checked' : ''} aria-label="${o.nombre}">
      <span style="background:${o.color}"></span>
    </label>`).join('')}</div>`;
}

function opcionesRostro(elegido) {
  return `<div class="rostros">${ROSTROS.map((r) => {
    const ry = 10;
    const rx = ry * formaRostro(r.id).ancho;
    return `
    <label class="rostro">
      <input type="radio" name="rostro" value="${r.id}" ${r.id === elegido ? 'checked' : ''}>
      <span>
        <svg viewBox="-13 -12 26 24" aria-hidden="true"><path d="${caminoRostro(r.id, 0, 0, rx, ry)}"/></svg>
        ${r.nombre}
      </span>
    </label>`;
  }).join('')}</div>`;
}

function deslizador(campo, etiqueta, valor) {
  const { min, max, unidad } = LIMITES[campo];
  return `
    <div class="campo">
      <div class="campo-encabezado">
        <label for="${campo}">${etiqueta}</label>
        <output id="${campo}-valor">${valor} ${unidad}</output>
      </div>
      <div class="deslizador">
        <button type="button" class="boton-redondo" data-ajustar="${campo}" data-paso="-1" aria-label="Menos">−</button>
        <input type="range" id="${campo}" name="${campo}" min="${min}" max="${max}" step="1" value="${valor}">
        <button type="button" class="boton-redondo" data-ajustar="${campo}" data-paso="1" aria-label="Más">+</button>
      </div>
    </div>`;
}

function tipoEstatura(cm) {
  if (cm < 160) return 'Petite';
  if (cm <= 170) return 'Estatura media';
  return 'Alta';
}

function plantilla(perfil) {
  return `
    <section class="tarjeta-avatar" aria-label="Vista previa">
      <div class="vista-avatar" id="vista-avatar">
        <div class="avatar" id="avatar"></div>
        <figure class="foto-referencia" id="foto-referencia" hidden>
          <img id="foto-imagen" alt="Tu foto de referencia">
          <figcaption>Tu foto</figcaption>
        </figure>
      </div>
      <p class="resumen-avatar">
        <span class="etiqueta" id="tipo-estatura">${tipoEstatura(perfil.estatura)}</span>
        <span class="estado-guardado" id="estado-guardado" aria-live="polite"></span>
      </p>
    </section>

    <form class="formulario" id="formulario-perfil" autocomplete="off">
      <section class="tarjeta">
        <h2>Foto de referencia</h2>
        <p class="ayuda">Una foto de cuerpo completo, de frente y con ropa ajustada. Solo se guarda en tu teléfono.</p>
        <div class="botones-foto">
          <label class="boton" for="foto">
            <span id="texto-boton-foto">Tomar o subir foto</span>
          </label>
          <input type="file" id="foto" accept="image/*" hidden>
          <button type="button" class="boton boton-secundario" id="quitar-foto" hidden>Quitar</button>
        </div>
      </section>

      <section class="tarjeta">
        <h2>Sobre ti</h2>
        <div class="campo">
          <label for="nombre">¿Cómo te llamas? <span class="opcional">(opcional)</span></label>
          <input type="text" id="nombre" name="nombre" maxlength="30" value="${textoSeguro(perfil.nombre)}" placeholder="Tu nombre">
        </div>
        ${deslizador('estatura', 'Estatura', perfil.estatura)}
        ${deslizador('peso', 'Peso', perfil.peso)}
      </section>

      <section class="tarjeta">
        <h2>Tu cuerpo</h2>
        <div class="campo">
          <span class="etiqueta-campo">Busto</span>
          ${chips('busto', BUSTOS, perfil.busto)}
        </div>
        <div class="campo">
          <span class="etiqueta-campo">Cadera</span>
          ${chips('cadera', CADERAS, perfil.cadera)}
          <p class="ayuda" id="ayuda-cadera">${CADERAS.find((c) => c.id === perfil.cadera)?.ayuda ?? ''}</p>
        </div>
      </section>

      <section class="tarjeta">
        <h2>Forma de rostro</h2>
        <p class="ayuda">¿No estás segura? Recógete el cabello frente al espejo y fíjate en la parte más ancha de tu cara.</p>
        ${opcionesRostro(perfil.rostro)}
      </section>

      <section class="tarjeta">
        <h2>Tono de piel</h2>
        ${muestras('piel', TONOS_PIEL, perfil.piel)}
        <p class="ayuda" id="nombre-piel">${TONOS_PIEL.find((t) => t.color === perfil.piel)?.nombre ?? ''}</p>
      </section>

      <section class="tarjeta">
        <h2>Cabello</h2>
        <div class="campo">
          <span class="etiqueta-campo">Color</span>
          ${muestras('cabelloColor', COLORES_CABELLO, perfil.cabelloColor)}
          <p class="ayuda" id="nombre-cabello">${COLORES_CABELLO.find((c) => c.color === perfil.cabelloColor)?.nombre ?? ''}</p>
        </div>
        <div class="campo">
          <span class="etiqueta-campo">Largo</span>
          ${chips('cabelloLargo', LARGOS_CABELLO, perfil.cabelloLargo)}
        </div>
      </section>
    </form>`;
}

// ---------- Foto ----------

function mostrarFoto(foto) {
  if (urlFoto) URL.revokeObjectURL(urlFoto);
  urlFoto = foto ? URL.createObjectURL(foto) : null;
  const figura = document.getElementById('foto-referencia');
  figura.hidden = !foto;
  if (foto) document.getElementById('foto-imagen').src = urlFoto;
  document.getElementById('vista-avatar').classList.toggle('con-foto', Boolean(foto));
  document.getElementById('quitar-foto').hidden = !foto;
  document.getElementById('texto-boton-foto').textContent = foto ? 'Cambiar foto' : 'Tomar o subir foto';
}

// ---------- Pantalla ----------

export async function mostrar(contenedor) {
  const perfil = { ...PERFIL_INICIAL, ...(await leer('perfil')) };
  contenedor.innerHTML = plantilla(perfil);

  const formulario = document.getElementById('formulario-perfil');
  const avatar = document.getElementById('avatar');
  const estado = document.getElementById('estado-guardado');
  let esperaGuardar;

  const actualizarAvatar = () => {
    avatar.innerHTML = dibujarAvatar(perfil);
  };

  // Guarda unos instantes después del último cambio (no en cada movimiento).
  const programarGuardado = () => {
    estado.textContent = '';
    clearTimeout(esperaGuardar);
    esperaGuardar = setTimeout(async () => {
      await guardar('perfil', perfil);
      estado.textContent = '✓ Guardado';
    }, 500);
  };

  const leerFormulario = () => {
    const datos = new FormData(formulario);
    for (const [campo, valor] of datos) {
      if (campo in LIMITES) perfil[campo] = Number(valor);
      else if (campo in PERFIL_INICIAL) perfil[campo] = valor;
    }
    for (const campo of Object.keys(LIMITES)) {
      document.getElementById(`${campo}-valor`).textContent = `${perfil[campo]} ${LIMITES[campo].unidad}`;
    }
    document.getElementById('tipo-estatura').textContent = tipoEstatura(perfil.estatura);
    document.getElementById('ayuda-cadera').textContent = CADERAS.find((c) => c.id === perfil.cadera)?.ayuda ?? '';
    document.getElementById('nombre-piel').textContent = TONOS_PIEL.find((t) => t.color === perfil.piel)?.nombre ?? '';
    document.getElementById('nombre-cabello').textContent = COLORES_CABELLO.find((c) => c.color === perfil.cabelloColor)?.nombre ?? '';
    actualizarAvatar();
    programarGuardado();
  };

  formulario.addEventListener('input', leerFormulario);
  formulario.addEventListener('submit', (e) => e.preventDefault());

  // Botones − y + junto a estatura y peso.
  formulario.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-ajustar]');
    if (!boton) return;
    const control = document.getElementById(boton.dataset.ajustar);
    control.value = Number(control.value) + Number(boton.dataset.paso);
    leerFormulario();
  });

  // Foto de referencia
  document.getElementById('foto').addEventListener('change', async (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    try {
      const foto = await reducirFoto(archivo);
      await guardar('fotoReferencia', foto);
      mostrarFoto(foto);
      mostrarAviso('Foto guardada');
    } catch {
      mostrarAviso('No pudimos abrir esa foto. Prueba con otra.');
    }
    evento.target.value = '';
  });

  document.getElementById('quitar-foto').addEventListener('click', async () => {
    await borrar('fotoReferencia');
    mostrarFoto(null);
    mostrarAviso('Foto quitada');
  });

  actualizarAvatar();
  const foto = await leer('fotoReferencia');
  if (foto) mostrarFoto(foto);
}

export function salir() {
  if (urlFoto) URL.revokeObjectURL(urlFoto);
  urlFoto = null;
}
