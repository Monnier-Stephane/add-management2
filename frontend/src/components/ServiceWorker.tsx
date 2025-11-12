'use client'
import { useEffect } from 'react'

export function ServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          // Vérifier les mises à jour périodiquement
          setInterval(() => {
            registration.update();
          }, 60000); // Toutes les minutes
          
          // Écouter les mises à jour disponibles
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nouvelle version disponible, forcer le rechargement
                  if (confirm('Une nouvelle version est disponible. Voulez-vous recharger la page ?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Détecter le statut de connexion
    const handleOnline = () => {
      // Optionnel: recharger les données
    };

    const handleOffline = () => {
      // Mode hors ligne activé
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null;
}