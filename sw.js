// Service worker de Courses : précache l'application et la sert depuis le cache (hors ligne).
// Changer VERSION à chaque modification d'un fichier listé pour que les téléphones se mettent à jour.

const VERSION = 'v1.0.1';
const CACHE = `courses-${VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/core.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('courses-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = request.mode === 'navigate'
        ? (await cache.match(request, { ignoreSearch: true })) || (await cache.match('./index.html'))
        : await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      return fetch(request);
    })(),
  );
});
