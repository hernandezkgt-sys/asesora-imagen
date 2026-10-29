// Pequeñas ayudas de pantalla que comparten todas las secciones.

let temporizador;

// Muestra un mensajito abajo de la pantalla durante unos segundos.
export function mostrarAviso(texto) {
  const aviso = document.getElementById('aviso');
  aviso.textContent = texto;
  aviso.classList.add('visible');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => aviso.classList.remove('visible'), 2200);
}

// Evita que un texto escrito por la persona se interprete como código.
export function textoSeguro(texto = '') {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
