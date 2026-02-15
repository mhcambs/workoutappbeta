const CACHE_NAME = 'workout-tracker-v3.0.1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  console.log('[Service Worker] インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] 全ファイルをキャッシュしました');
      })
      .catch(error => {
        console.error('[Service Worker] キャッシュエラー:', error);
      })
  );
  // 即座にアクティベート
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  console.log('[Service Worker] アクティベート中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // すぐに制御を開始
  self.clients.claim();
});

// フェッチ時にキャッシュから返す（オフライン対応）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          console.log('[Service Worker] キャッシュから返す:', event.request.url);
          return response;
        }
        
        // なければネットワークから取得
        console.log('[Service Worker] ネットワークから取得:', event.request.url);
        return fetch(event.request).then(response => {
          // レスポンスが有効でない場合はそのまま返す
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // レスポンスをキャッシュに追加
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
            console.log('[Service Worker] キャッシュに追加:', event.request.url);
          });
          
          return response;
        }).catch(error => {
          console.error('[Service Worker] フェッチエラー:', error);
          // オフライン時のフォールバック（オプション）
          // return caches.match('./offline.html');
        });
      })
  );
});

// メッセージハンドラー（アップデート通知用）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
