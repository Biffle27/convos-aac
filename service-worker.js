
const CACHE_NAME = "convos-aac-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./src/css/styles.css",
    "./src/js/settings.js",
    "./src/js/speech.js",
    "./src/js/phrases.js",
    "./src/js/main.js",
    "./src/data/phrases.json"
];

// Cache the application files during installation.
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();
});

// Remove outdated caches.
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    // Handle page navigation, including launching
    // Convos AAC from the Home Screen.
    if (event.request.mode === "navigate") {
        event.respondWith(
            caches.match("./index.html").then((cachedPage) => {
                return cachedPage || fetch(event.request);
            })
        );
        return;
    }

    // Serve other application resources from cache.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});

// Serve cached files when available.
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
