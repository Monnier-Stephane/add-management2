'use client'
import { useEffect } from 'react'

export function ServiceWorker() {
  useEffect(() => {
    // Vérifier que nous sommes côté client
    if (typeof window === 'undefined') return;
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
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