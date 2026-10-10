var CACHE = 'fof-v5';
var ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'css/paper.css',
  'data/statements.js', 'data/easy.js', 'data/hard.js', 'js/state.js', 'js/deck.js', 'js/audio.js', 'js/confetti.js',
  'js/paper.js', 'js/ui.js', 'js/main.js', 'audio/fake.mp3', 'audio/fact.mp3', 'audio/music.mp3',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Stale-while-revalidate: instant offline loads, refreshed in the background.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request, { cache: 'no-cache' }).then(function (r) {
        if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone());
        return r;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
