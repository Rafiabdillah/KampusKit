importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "favorable-ally-phh41",
  appId: "1:803062276296:web:9808169b19a42880ac85fd",
  apiKey: "AIzaSyCsio0UqgPAHwc_r1LFL0YmaHrrwXLejiI",
  authDomain: "favorable-ally-phh41.firebaseapp.com",
  storageBucket: "favorable-ally-phh41.firebasestorage.app",
  messagingSenderId: "803062276296"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Neuro-Spiritual KampusKit';
  const notificationOptions = {
    body: payload.notification?.body || 'Bahan bakar semangat harian untuk performa puncakmu.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/?view=motivation',
      type: payload.data?.type || 'motivation'
    },
    actions: [
      { action: 'open_app', title: '🚀 Buka KampusKit' },
      { action: 'read_quote', title: '💡 Baca Hikmah' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification Click Handler - Focus or open the applet
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Periodic Background Sync for Motivational Pushes (where supported by browser/PWA)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-motivation-sync') {
    event.waitUntil(
      self.registration.showNotification('☀️ Sapaan Pagi & Priming Otak', {
        body: 'Awali harimu dengan niat kuat, fokus pada 1 prioritas utama, dan raih kemajuan 1% hari ini!',
        icon: '/icon-192.png',
        vibrate: [150, 80, 150]
      })
    );
  }
});
