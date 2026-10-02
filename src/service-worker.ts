/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

// 舊版（AI Studio PWA）留下的快取名稱，啟用時一併清掉
const LEGACY_CACHES = ['badminton-app-v1'];

// 新版一裝好就接手，不必等所有分頁關閉
self.skipWaiting();
clientsClaim();

// build 時由 vite-plugin-pwa 注入要預先快取的檔案清單（含字型），離線也能開
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 所有頁面導覽都回傳快取的 index.html（單頁應用）
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all(LEGACY_CACHES.map(name => caches.delete(name))));
});
