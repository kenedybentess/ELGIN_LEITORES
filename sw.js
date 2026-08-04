const CACHE_NAME = 'el250-flash-v6-vinculado';
const ASSETS = [
  './',
  './index.html',
  './produtos.html',
  './operadores.html',
  './testes.html',
  './logs.html',
  './etiquetas.html',
  './offline-barcode.js',
  './manifest.json'
];

const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of ASSETS) {
        try { await cache.add(url); } catch(err) { console.log('ASSET fail', url); }
      }
      for (const url of CDN_ASSETS) {
        try { 
          const req = new Request(url, {mode:'no-cors'});
          const res = await fetch(url);
          if(res.ok) await cache.put(url, res.clone());
          else await cache.add(url);
        } catch(err) { 
          try {
            const res = await fetch(url);
            if(res.ok) await cache.put(url, res.clone());
          } catch(e2) { console.log('CDN cache fail', url); }
        }
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
  if (req.url.includes('10.50.1.143')) return;
  e.respondWith(
    caches.match(req).then(async cached => {
      if (cached) return cached;
      try {
        const networkRes = await fetch(req);
        if (networkRes.ok) {
          const url = req.url;
          const shouldCache = url.includes('cdn.jsdelivr') || url.includes('jsdelivr') || url.includes('bootstrap') || url.includes('googleapis') || url.includes('gstatic') || url.includes('flaticon');
          if (shouldCache) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
        }
        return networkRes;
      } catch (err) {
        if (req.mode === 'navigate') {
          // tenta retornar exatamente a pagina pedida do cache
          const url = new URL(req.url);
          const pathname = url.pathname.split('/').pop() || 'index.html';
          const match = await caches.match('./' + pathname) || await caches.match(pathname);
          if (match) return match;
          return (await caches.match('./etiquetas.html')) || (await caches.match('./index.html'));
        }
        if (req.url.includes('fonts.googleapis') || req.url.includes('gstatic')) {
          return new Response('', {status:200, headers:{'Content-Type':'text/css'}});
        }
      }
    })
  );
});
