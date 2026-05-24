const CACHE_NAME = 'food-spinner-v3';
const urlsToCache = [
  './',
  './index.html',
  './icon-192.png',
  './manifest.json'
];

// 安装：缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }).catch((err) => {
      console.error('Cache failed:', err);
    })
  );
  self.skipWaiting();
});

// 激活：清理所有旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 抓取：网络优先，失败回退缓存
self.addEventListener('fetch', (event) => {
  // 只处理同源请求
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      // 网络成功，更新缓存
      if (networkResponse && networkResponse.status === 200) {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
      }
      return networkResponse;
    }).catch(() => {
      // 网络失败，回退缓存
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // 缓存也没有，返回离线提示
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>离线</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff5f7;color:#5a3d44;text-align:center;padding:20px;}</style></head><body><div><h2>🌸 离线模式</h2><p>请连接网络后刷新页面</p><button onclick="location.reload()" style="padding:12px 24px;border:none;border-radius:20px;background:#ff6b8a;color:#fff;font-size:1rem;margin-top:16px;cursor:pointer;">刷新试试</button></div></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});

// 监听消息：强制跳过等待
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});