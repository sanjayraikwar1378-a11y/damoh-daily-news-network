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

// Register Service Worker for offline shell caching and speed
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}


