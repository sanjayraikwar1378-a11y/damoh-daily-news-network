import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out benign HMR WebSocket connection warnings/errors from taking down the page
window.addEventListener('error', (event) => {
  const message = String(event.error?.message || event.message || '');
  if (message.includes('WebSocket') || message.includes('vite')) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason?.message || event.reason || '');
  if (reason.includes('WebSocket') || reason.includes('vite')) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Proactively unregister any active/legacy Service Worker and clean up SW caches to ensure blazing-fast direct loads
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().catch(() => {});
    }
  }).catch(() => {});

  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key.includes('damoh') || key.includes('workbox') || key.includes('sw-')) {
          caches.delete(key).catch(() => {});
        }
      });
    }).catch(() => {});
  }
}


