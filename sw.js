// 版本更新时自动清除所有旧缓存
var CACHE_VERSION = 'food-spinner-v1.0.3';
const CACHE_NAME = CACHE_VERSION;
const urlsToCache = [
    './',
    './index.html',
    './icon-192.png',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((fetchResponse) => {
                if (fetchResponse && fetchResponse.status === 200) {
                    const responseClone = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return fetchResponse;
            }).catch(() => {
                return new Response('离线模式，请连接网络后刷新', {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            });
        }).catch(() => {
            return fetch(event.request).catch(() => {
                return new Response('离线模式，请连接网络后刷新', {
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            });
        })
    );
});


self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});