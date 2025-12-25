const STATIC_CACHE = 'add-management-static-v5';
const DYNAMIC_CACHE = 'add-management-dynamic-v5';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker v5 - Installation en cours...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
    .then((cache) => cache.addAll(urlsToCache))
    .then(() => {
      console.log('✅ Service Worker v5 - Installation terminée');
      self.skipWaiting(); // Forcer l'activation immédiate
    })
    .catch((error) => {
      console.error('❌ Service Worker v5 - Erreur installation:', error);
      self.skipWaiting();
    })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker v5 - Activation en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer TOUS les anciens caches (v2, v3, v4, etc.)
          if (!cacheName.includes('v5')) {
            console.log('🗑️ Suppression du cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker v5 - Activation terminée');
      return self.clients.claim(); // Prendre le contrôle immédiatement
    })
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
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
        .catch(() => {
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

// Gestion des messages pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Message reçu: Forcer la mise à jour du Service Worker');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Message reçu: Nettoyer le cache');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Suppression du cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
  }
});

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