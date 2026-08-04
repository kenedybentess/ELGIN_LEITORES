const CACHE_NAME = 'el250-flash-v8-offline-total';
const ASSETS = [
  './',
  './index.html',
  './produtos.html',
  './operadores.html',
  './testes.html',
  './etiquetas.html',
  './auth.js',
  './offline-barcode.js',
  './manifest.json'
];

const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // cache local primeiro
      for (const url of ASSETS) {
        try { 
          const req = new Request(url, {cache:'reload'});
          const res = await fetch(req);
          if(res.ok) await cache.put(req, res.clone());
          else await cache.add(url);
        } catch { 
          try { await cache.add(url); } catch(err){ console.log('fail',url); }
        }
      }
      // tenta cachear CDN mas não falha se offline
      for (const url of CDN_ASSETS) {
        try {
          const res = await fetch(url, {cache:'no-cache'});
          if(res.ok) await cache.put(url, res.clone());
        } catch {}
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.url.includes('10.50.1.143') || req.url.includes('chrome-extension')) return;
  if (req.method !== 'GET') return;
  
  e.respondWith((async()=>{
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if(cached) return cached;
    
    try{
      const networkRes = await fetch(req);
      if(networkRes.ok){
        // cacheia tudo que for local ou CDN
        if(req.url.includes(self.location.origin) || req.url.includes('cdn.jsdelivr') || req.url.includes('gstatic')){
          cache.put(req, networkRes.clone());
        }
      }
      return networkRes;
    }catch(err){
      // OFFLINE FALLBACK
      if(req.mode === 'navigate'){
        // tenta index, depois testes, depois qualquer cache
        return (await cache.match('./index.html')) || (await cache.match('./testes.html')) || (await cache.match('/index.html')) || new Response('<h1>Offline - Sistema EL250</h1><p>Recarregue quando online</p>', {headers:{'Content-Type':'text/html'}});
      }
      // para CSS/JS tenta cache
      const fallback = await cache.match(req);
      if(fallback) return fallback;
      // se for bootstrap que falhou, retorna CSS vazio para não quebrar layout
      if(req.url.includes('.css')){
        return new Response('/* offline fallback */', {headers:{'Content-Type':'text/css'}});
      }
      if(req.url.includes('.js')){
        return new Response('/* offline */', {headers:{'Content-Type':'application/javascript'}});
      }
      return new Response('', {status:200});
    }
  })());
});
