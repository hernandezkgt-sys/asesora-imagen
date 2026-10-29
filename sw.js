// Ayudante (service worker): guarda una copia de la app en el teléfono
// para que abra aunque no haya internet.
// Si cambias archivos de la app, sube el número de versión.
const CACHE = 'mi-asesora-v3';

const ARCHIVOS = [
  './',
  'index.html',
  'manifest.json',
  'css/estilos.css',
  'js/app.js',
  'js/almacen.js',
  'js/ui.js',
  'js/fotos.js',
  'js/closet/catalogo.js',
  'js/pantallas/closet.js',
  'js/pantallas/perfil.js',
  'js/pantallas/objetivos.js',
  'js/asesoria/objetivos.js',
  'js/avatar/dibujar-avatar.js',
  'js/avatar/partes.js',
  'iconos/icono.svg',
  'iconos/icono-180.png',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) => Promise.all(
      nombres.filter((nombre) => nombre !== CACHE).map((nombre) => caches.delete(nombre)),
    )),
  );
  self.clients.claim();
});

// Primero intenta internet (para ver siempre lo más nuevo);
// si no hay conexión, usa la copia guardada.
self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    fetch(evento.request)
      .then((respuesta) => {
        if (respuesta.ok && new URL(evento.request.url).origin === location.origin) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(evento.request, copia));
        }
        return respuesta;
      })
      .catch(() => caches.match(evento.request, { ignoreSearch: true })),
  );
});
