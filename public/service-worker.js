const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/offlineBudgetTracker.js"
];

const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

//install
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => cache.addAll(FILES_TO_CACHE)).then(() => self.skipWaiting())
    );
});

//activate
self.addEventListener("activate", event => {
    const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(
                //remove old cache data
                cachesToDelete.map(cacheToDelete => {
                    return caches.delete(cacheToDelete);
                })
            );
        }).then(() => self.clients.claim())
    );
});

//fetch
self.addEventListener("fetch", function (evt) {
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
            caches.open(RUNTIME_CACHE).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        //if the response was good, clone it and store it in the cache
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        //network request failed, try to get it from the cache
                        return cache.match(evt.request);
                    });
            }).catch(err => console.log(err))
        );

        return;
    }

    evt.respondWith(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.match(evt.request).then(response => {
                return response || fetch(evt.request);
            });
        })
    );
});