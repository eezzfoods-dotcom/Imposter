// Imposter India — Service Worker
var CACHE_NAME = 'imposter-india-v3';
var ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&family=Noto+Serif+Tamil&display=swap'
];

// Install: cache core assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {
        // If some assets fail, still complete install
        return cache.add('./index.html');
      });
    })
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for game assets, network-first for Firebase
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Always use network for Firebase (real-time data)
  if (url.indexOf('firebaseio.com') >= 0 ||
      url.indexOf('googleapis.com/identitytoolkit') >= 0) {
    return;
  }

  // Cache-first for everything else
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response && response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback — return main page
        return caches.match('./index.html');
      });
    })
  );
});
