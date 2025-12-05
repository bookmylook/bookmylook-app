// Service worker completely disabled - no caching
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// No fetch handler - let all requests go directly to network

// Handle app shortcuts
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'book') {
    event.waitUntil(
      clients.openWindow('/booking')
    );
  } else if (event.action === 'providers') {
    event.waitUntil(
      clients.openWindow('/providers')
    );
  }
});
