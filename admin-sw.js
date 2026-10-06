/* Service worker del Panel de Yeimer.
   Hace UNA sola cosa: que el Panel abra aunque no haya internet (muestra la pantalla y avisa
   que no hay conexión). Para eso guarda una copia de los archivos del propio Panel.

   Lo que NUNCA toca:
   - Las llamadas a Google (agenda, clientes, citas): siempre van directo a internet, nunca se guardan.
   - La página pública de clientes (index.html): este service worker solo controla admin.html.
   Los archivos del Panel se piden primero a internet y la copia guardada solo se usa si falla,
   así que cuando se publica una versión nueva, se ve de una. */

const VERSION = 'panel-v1';
const BASE = self.location.href;                       // .../admin-sw.js
const ARCHIVOS = ['admin.html', 'datos.js', 'admin.webmanifest', 'icons/admin-192.png', 'icons/admin-512.png']
  .map(f => new URL(f, BASE).href);

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.all(ARCHIVOS.map(u => c.add(u).catch(() => {}))))   // si uno falla, no se cae la instalación
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                    // las acciones (guardar, cancelar) nunca se tocan
  const url = new URL(req.url);
  const propio = ARCHIVOS.includes(url.origin + url.pathname);
  if (!propio) return;                                 // Google, fuentes, todo lo demás: directo a internet

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(url.origin + url.pathname, copia)); }
        return res;
      })
      .catch(() => caches.match(url.origin + url.pathname).then(r => r || Response.error()))
  );
});
