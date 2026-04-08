// GRVTY Service Worker v1
const CACHE_NAME = 'grvty-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'])
        .catch(() => cache.add('./index.html'));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.hostname === 'api.anthropic.com') return;

  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com') || url.hostname.includes('fonts.')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        fetch(event.request).then(r => { cache.put(event.request, r.clone()); return r; })
          .catch(() => cache.match(event.request))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(r => {
        if (r && r.status === 200) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, r.clone()));
        }
        return r;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
