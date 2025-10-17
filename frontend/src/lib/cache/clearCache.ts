'use client'

export const clearAllCaches = async (): Promise<void> => {
  try {
    console.log('🧹 Début du nettoyage du cache...');
    
    // Nettoyer le cache du navigateur
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('📦 Caches trouvés:', cacheNames);
      
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('🗑️ Suppression du cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }

    // Désinscrire le Service Worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🔧 Service Workers trouvés:', registrations.length);
      
      await Promise.all(
        registrations.map(registration => {
          console.log('🗑️ Désinscription du Service Worker');
          return registration.unregister();
        })
      );
    }

    // Nettoyer le localStorage (garder les données importantes)
    const importantKeys = ['userProfile_', 'userProfile_timestamp_', 'attendanceData'];
    const keysToKeep: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && importantKeys.some(importantKey => key.includes(importantKey))) {
        keysToKeep.push(key);
      }
    }
    
    // Sauvegarder les données importantes
    const importantData: Record<string, string> = {};
    keysToKeep.forEach(key => {
      importantData[key] = localStorage.getItem(key) || '';
    });
    
    // Nettoyer tout le localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Restaurer les données importantes
    Object.entries(importantData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    console.log('✅ Cache nettoyé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
};

export const forceServiceWorkerUpdate = async (): Promise<void> => {
  try {
    console.log('🔄 Forçage de la mise à jour du Service Worker...');
    
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // Forcer la mise à jour
        await registration.update();
        
        // Envoyer un message au Service Worker
        if (registration.active) {
          registration.active.postMessage({ type: 'SKIP_WAITING' });
        }
        
        // Envoyer un message pour nettoyer le cache
        if (registration.active) {
          registration.active.postMessage({ type: 'CLEAR_CACHE' });
        }
      }
    }
    
    console.log('✅ Service Worker mis à jour');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du Service Worker:', error);
  }
};

export const checkAndUpdateCache = async (): Promise<void> => {
  try {
    const lastVersion = localStorage.getItem('app_version');
    const currentVersion = 'v4.0.0';
    
    if (lastVersion !== currentVersion) {
      console.log('🔄 Mise à jour détectée:', lastVersion, '→', currentVersion);
      
      // Nettoyer le cache
      await clearAllCaches();
      
      // Forcer la mise à jour du Service Worker
      await forceServiceWorkerUpdate();
      
      // Sauvegarder la nouvelle version
      localStorage.setItem('app_version', currentVersion);
      
      console.log('✅ Mise à jour terminée');
      
      // NE PAS recharger automatiquement - laisser l'utilisateur continuer
      // setTimeout(() => {
      //   window.location.reload();
      // }, 1000);
    } else {
      console.log('✅ Version à jour:', currentVersion);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la version:', error);
  }
};
