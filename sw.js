const CACHE_NAME = 'food-spinner-v4';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './icon-192.png',
                './manifest.json'
            ]);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // 只处理同源
    if (new URL(event.request.url).origin !== self.location.origin) return;

    // 导航请求（打开页面）特殊处理
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // 网络失败，尝试多种缓存匹配
                return caches.match(event.request).then((r) => {
                    if (r) return r;
                    return caches.match('./index.html');
                }).then((r) => {
                    if (r) return r;
                    return caches.match('./');
                }).then((r) => {
                    if (r) return r;
                    // 兜底：内联离线页面
                    return new Response(
                        '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>今天吃什么呀？</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:linear-gradient(135deg,#fff5f7,#ffe8f0);color:#5a3d44;text-align:center;padding:20px;}h2{color:#ff6b8a;font-size:1.5rem;margin-bottom:12px;}p{line-height:1.6;margin-bottom:20px;}button{padding:14px 28px;border:none;border-radius:50px;background:#ff6b8a;color:#fff;font-size:1rem;cursor:pointer;}</style></head><body><div><h2>🌸 离线模式</h2><p>请连接网络后刷新页面</p><button onclick="location.reload()">刷新试试</button></div></body></html>',
                        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                    );
                });
            })
        );
        return;
    }

    // 其他资源：缓存优先，网络兜底
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return networkResponse;
            });
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});