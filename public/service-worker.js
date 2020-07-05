const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "index.js",
    "styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => cache.addAll(FILES_TO_CACHE)).then(() => self.skipWaiting())
    );
});

// self.addEventListener('install', function (event) {
//     event.waitUntil(
//         caches.open(STATIC_CACHE)
//             .then(function (cache) {
//                 return cache.addAll(FILES_TO_CACHE);
//             })
//     );
// });

self.addEventListener("activate", event => {
    const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(
                cachesToDelete.map(cacheToDelete => {
                    return caches.delete(cacheToDelete);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// self.addEventListener('activate', function (event) {
//     var cacheWhitelist = [STATIC_CACHE, RUNTIME_CACHE];
//     event.waitUntil(
//         caches.keys().then(function (cacheNames) {
//             return Promise.all(
//                 cacheNames.map(function (cacheName) {
//                     if (cacheWhitelist.indexOf(cacheName) === -1) {
//                         return caches.delete(cacheName);
//                     }
//                 })
//             );
//         })
//     );
// });

self.addEventListener("fetch", event => {
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return caches.open(RUNTIME_CACHE).then(cache => {
                    return fetch(event.request).then(response => {
                        return cache.put(event.request, response.clone()).then(() => {
                            return response;
                        });
                    });
                });
            })
        );
    }
});

// self.addEventListener('fetch', function (event) {
//     event.respondWith(
//         caches.match(event.request)
//             .then(function (response) {
//                 if (response) {
//                     return response;
//                 }

//                 return fetch(event.request).then(
//                     function (response) {
//                         if (!response || response.status !== 200 || response.type !== 'basic') {
//                             return response;
//                         }
//                         var responseToCache = response.clone();

//                         caches.open(RUNTIME_CACHE)
//                             .then(function (cache) {
//                                 cache.put(event.request, responseToCache);
//                             });

//                         return response;
//                     }
//                 );
//             })
//     );
// });