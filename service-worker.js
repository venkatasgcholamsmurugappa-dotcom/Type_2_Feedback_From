const CACHE = 'offline-cache-v1';
const FILES = [
  '/',
  '/index.html',
  '/app.js',
  '/service-worker.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method === 'GET') {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
