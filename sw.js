const CACHE_NAME = 'madrasa-v2-cache-v6';
const ASSETS = ['./index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // Always go to network first for Firebase / Google CDN requests (cloud sync, fonts, SDK)
  if (url.includes('firebaseio.com') || url.includes('googleapis.com') || url.includes('gstatic.com')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // NETWORK-FIRST for our own app files (index.html, this sw.js, etc).
  // This is the part that was wrong before: it was cache-first, so once a
  // phone had cached the app once, it would keep showing that exact old
  // version forever — even after we fixed bugs and uploaded a new
  // index.html — until the user manually cleared the app's storage.
  // Network-first means: always try to fetch the newest file first, and
  // only fall back to the cached copy if there's no internet right now
  // (so the app still opens offline, just possibly with an older version)
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).then((res) => {
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
