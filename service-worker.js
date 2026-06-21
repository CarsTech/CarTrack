importScripts('./version.js');

const CACHE_NAME = `cartrack-v${APP_VERSION}`;

const FILES_TO_CACHE = [
  '.',
  'index.html',
  'styles.css',
  'app.js',
  'version.js',
  'manifest.json',
  'icons/330px-Fluent_Emoji_Color_1f697.svg.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Always fetch these fresh — Live Server works without hard refresh
  if (
    url.pathname.endsWith('app.js') ||
    url.pathname.endsWith('styles.css') ||
    url.pathname.endsWith('version.js') ||
    url.pathname.endsWith('index.html') ||
    url.pathname.endsWith('/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
