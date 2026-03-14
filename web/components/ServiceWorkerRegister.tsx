'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                        // Registration was successful
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    (err) => {
                        // registration failed
                        console.log('ServiceWorker registration failed: ', err);
                    }
                );
            });
        }
    }, []);

    return null;
}
