const version = '0.4.0';
const cacheName = `cache-${version}`;
const urlsToCache = ['/img/bg.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      const url = new URL(event.request.url);
      if (urlsToCache.includes(url.pathname)) {
        return fetch(event.request).then((response) => {
          const clonedResponse = response.clone();
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          } else {
            caches.open(cacheName).then((cache) => {
              cache.put(event.request, clonedResponse);
            });

            return response;
          }
        });
      }

      return fetch(event.request);
    })
  );
});
