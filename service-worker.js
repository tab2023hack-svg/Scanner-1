// Define a cache name
const CACHE_NAME = 'inventory-scanner-cache-v1';

// List all local files and essential assets to be cached
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './index.tsx',
    './App.tsx',
    './types.ts',
    './hooks/useLocalStorage.ts',
    './components/FileUpload.tsx',
    './components/Scanner.tsx',
    './components/ScannedItemsTable.tsx',
    './components/Toast.tsx',
    './components/Icons.tsx',
    './components/Statistics.tsx',
    'https://github.com/tab2023hack-svg/sound-beeb/raw/refs/heads/main/beeb.mp3'
];

// Install event: open cache and add all specified URLs
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching app assets');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Fetch event: serve from cache first, with a network fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // If the request is in the cache, return the cached version
      // Otherwise, fetch it from the network
      return response || fetch(event.request);
    })
  );
});
