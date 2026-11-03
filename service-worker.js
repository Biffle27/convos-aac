
const CACHE_NAME = "convos-aac-v5";

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


self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    // For page navigation, try the network first.
    // Fall back to the cached page when offline.
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                return cache.match("./index.html");
            })
        );
        return;
    }

    // For other files, use cache first.
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
