// ============================================================
// PINARAK Service Worker v2.0
// Aplikasi Akuntansi BUMDES Bicak Makmur
// Strategi: Network-first agar selalu dapat versi terbaru
// ============================================================

const CACHE_NAME = 'pinarak-v2.0.0';
const ASSETS = [
  './',
  './index.html',
  './PINARAK.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  console.log('[PINARAK SW] Installing v2.0.0');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[PINARAK SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[PINARAK SW] Activated v2.0.0 - clearing old caches');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[PINARAK SW] Deleting old cache:', k);
        return caches.delete(k);
      })
    ))
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  // Network-first: selalu ambil dari server, fallback ke cache
  event.respondWith(
    fetch(event.request).then(response => {
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => {
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
