const CACHE_NAME = 'el250-flash-v7-corrigido';
const ASSETS = [
  './',
  './index.html',
  './produtos.html',
  './operadores.html',
  './testes.html',
  './auth.js',
  './offline-barcode.js',
  './manifest.json'
];

const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of ASSETS) {
        try { await cache.add(url); } catch(err) { console.log('ASSET fail', url, err); }
      }
      for (const url of CDN_ASSETS) {
        try { 
          const res = await fetch(url);
          if(res.ok) await cache.put(url, res.clone());
        } catch(err) { console.log('CDN fail', url); }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.url.includes('10.50.1.143') || req.url.includes('chrome-extension')) return;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(async cached => {
      if (cached) return cached;
      try {
        const networkRes = await fetch(req);
        // cacheia CDN dinamicamente
        if (networkRes.ok && (req.url.includes('cdn.jsdelivr') || req.url.includes('gstatic') || req.url.includes('googleapis'))) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return networkRes;
      } catch (err) {
        if (req.mode === 'navigate') {
          const fallback = await caches.match('./index.html');
          if(fallback) return fallback;
        }
        return new Response('Offline', {status:503});
      }
    })
  );
});
