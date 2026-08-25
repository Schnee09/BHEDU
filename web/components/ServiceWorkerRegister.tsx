'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // In development: completely unregister any active Service Workers and clear caches
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('[Dev] Unregistered stale ServiceWorker:', registration.scope);
        }
      });

      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          for (const cacheName of cacheNames) {
            caches.delete(cacheName);
            console.log('[Dev] Cleared ServiceWorker cache:', cacheName);
          }
        });
      }
      return;
    }

    // In production: register service worker safely
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        },
        (err) => {
          console.log('ServiceWorker registration failed: ', err);
        }
      );
    });
  }, []);

  return null;
}
