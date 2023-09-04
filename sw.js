const CACHE_NAME = 'ExifFrame-cache-v1';
const urlsToCache = [
  '/index.html',
  '/index.css',
  '/script.js',
  '/terms.html',
  '/terms.css',
  '/global.css'
];

// インストール処理
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// リソースフェッチ時のキャッシュロード処理
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches
      .match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
  );
});