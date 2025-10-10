const CACHE = 'offline-cache-v4';
const FILES = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/locations.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => self.clients.claim());

self.addEventListener('fetch', e => {
  if (e.request.method === 'GET') {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});

// Background Sync
self.addEventListener('sync', async event => {
  if (event.tag === 'sync-responses') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  const client = await self.clients.get((await self.clients.matchAll())[0].id);
  await client.postMessage({ type: 'AUTO_SYNC' });
}
