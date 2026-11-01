import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthWrapper } from './components/AuthWrapper';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker safely (graceful in iframes or sandboxed environments)
let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    updateSW = registerSW({
      onNeedRefresh() {
        try {
          if (updateSW) updateSW(true);
        } catch {
          // ignore
        }
      },
      onOfflineReady() {
        console.log('App siap digunakan offline di Android, Apple, dan Windows');
      },
    });
  }
} catch (swError) {
  console.warn('Service Worker registration skipped in current frame context:', swError);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthWrapper>
      <App />
    </AuthWrapper>
  </React.StrictMode>
);