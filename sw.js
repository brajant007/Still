// Nasze Wózki — Service Worker
// Wersja cache — zmień przy każdym deploymencie
const CACHE = 'nw-v6-cache';
const ASSETS = [
  '/Still/',
  '/Still/index.html',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@300;400;500;600&display=swap'
];

// Instalacja — zapisz pliki do cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Aktywacja — usuń stare cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first dla zasobów lokalnych, network first dla fontów/API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ntfy.sh — zawsze sieć, nie cachuj
  if (url.hostname === 'ntfy.sh') return;

  // Fonty Google — cache first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
      )
    );
    return;
  }

  // index.html — network first, fallback cache (żeby aktualizacje działały)
  if (url.pathname.endsWith('/Still/') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Reszta — cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
