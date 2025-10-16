const STATIC_CACHE = 'add-management-static-v2';
const DYNAMIC_CACHE = 'add-management-dynamic-v2';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
    .then((cache) => cache.addAll(urlsToCache))
    .then(() => self.skipWaiting())
    .catch(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Gestion des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ne pas intercepter les chunks Next.js pour éviter les conflits
  if (request.url.includes('/_next/static/chunks/') || 
      request.url.includes('/_next/static/css/') ||
      request.url.includes('/_next/static/media/') ||
      request.url.includes('/_next/static/js/') ||
      request.url.includes('/_next/webpack-hmr')) {
    return;
  }
  
  // Ne pas mettre en cache les appels API - toujours aller au réseau
  if (request.url.includes('/api/') || 
      request.url.includes('/subscriptions') || 
      request.url.includes('/coaches') || 
      request.url.includes('/planning')) {
    event.respondWith(
      fetch(request, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).catch(() => {
        return new Response('Ressource non disponible hors ligne', {
          status: 404
        });
      })
    );
    return;
  }
  
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => {
              if (request.destination === 'document') {
                return caches.match('/');
              }
              return new Response('Ressource non disponible hors ligne', {
                status: 404
              });
            });
        })
    );
  }
});

// ... code existant ...

// Gestion des notifications push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification de ADD Management',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Dashboard',
        icon: '/icon-192.png'
      },
      {
        action: 'view',
        title: 'Planning',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ADD Management', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard/planning')
    );
  } else if (event.action === 'close' || event.action === 'dismiss') {
    // Notification fermée - rien à faire
  } else {
    // Clic sur la notification (pas sur une action)
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});