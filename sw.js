const CACHE_NAME = 'weather-app-br-v3';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './ai-fallback.js',
    './config.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames
                .filter((name) => name !== CACHE_NAME)
                .map((name) => caches.delete(name))
        );
        await self.clients.claim();
    })());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const isSameOrigin = url.origin === self.location.origin;
    const isNavigation = request.mode === 'navigate';
    const isStaticAsset = isSameOrigin && /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|json)$/i.test(url.pathname);

    if (isNavigation) {
        event.respondWith((async () => {
            try {
                const fresh = await fetch(request);
                const cache = await caches.open(CACHE_NAME);
                cache.put('./index.html', fresh.clone());
                return fresh;
            } catch (error) {
                const cached = await caches.match('./index.html');
                return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
            }
        })());
        return;
    }

    if (isStaticAsset) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(request);
            const networkFetch = fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        cache.put(request, response.clone());
                    }
                    return response;
                })
                .catch(() => null);

            return cached || networkFetch || fetch(request);
        })());
        return;
    }

    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});
