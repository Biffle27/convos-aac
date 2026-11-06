
const CACHE_NAME = "convos-aac-v9";

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

// Download the complete application into a new cache.
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(APP_FILES);
            await self.skipWaiting();
        })
    );
});

// Remove older app caches after activation.
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();

            await Promise.all(
                cacheNames
                    .filter((name) =>
                        name.startsWith("convos-aac-") &&
                        name !== CACHE_NAME
                    )
                    .map((name) => caches.delete(name))
            );

            await self.clients.claim();
        })()
    );
});

// Serve files belonging to the active app version.
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Only manage resources belonging to our app.
    if (
        url.origin !== self.location.origin ||
        !url.pathname.startsWith(
            new URL(self.registration.scope).pathname
        )
    ) {
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedPage = await cache.match("./index.html");

                return cachedPage || fetch(event.request);
            })
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request);

            return cachedResponse || fetch(event.request);
        })
    );
});
