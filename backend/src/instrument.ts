import * as Sentry from "@sentry/nestjs";

// Sauvegarder le DSN original
if (!process.env.SENTRY_DSN_ORIGINAL) {
  process.env.SENTRY_DSN_ORIGINAL = process.env.SENTRY_DSN;
}

// Service de monitoring du quota Sentry
class SentryQuotaService {
  private eventCount = 0;
  private readonly MAX_EVENTS = 4500; // 90% du quota gratuit
  private readonly WARNING_THRESHOLD = 4000; // 80% du quota
  
  constructor() {
    this.loadEventCount();
    setInterval(() => this.checkQuota(), 60 * 60 * 1000); // Vérifier toutes les heures
  }
  
  private loadEventCount() {
    try {
      const stored = localStorage?.getItem('sentry_event_count');
      this.eventCount = stored ? parseInt(stored) : 0;
    } catch (error) {
      this.eventCount = 0;
    }
  }
  
  private saveEventCount() {
    try {
      localStorage?.setItem('sentry_event_count', this.eventCount.toString());
    } catch (error) {
      // localStorage non disponible (backend)
    }
  }
  
  private checkQuota() {
    if (this.eventCount >= this.MAX_EVENTS) {
      console.warn('🚫 Sentry quota dépassé (90%), désactivation automatique');
      return false;
    }
    
    if (this.eventCount >= this.WARNING_THRESHOLD) {
      console.warn('⚠️ Sentry quota à 80%, attention !');
    }
    
    return true;
  }
  
  canSendEvent() {
    return this.checkQuota();
  }
  
  incrementEventCount() {
    this.eventCount++;
    this.saveEventCount();
  }
  
  getCurrentUsage() {
    return {
      current: this.eventCount,
      max: 5000,
      percentage: Math.round((this.eventCount / 5000) * 100),
      remaining: 5000 - this.eventCount
    };
  }
}

const quotaService = new SentryQuotaService();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // Réduire en production
  sendDefaultPii: true,
  
  beforeSend(event) {
    if (!quotaService.canSendEvent()) {
      console.warn('🚫 Sentry quota dépassé, événement ignoré');
      return null;
    }
    
    quotaService.incrementEventCount();
    
    // Filtrer les événements non critiques
    if (event.level === 'info' && event.exception) {
      return null;
    }
    
    if (process.env.NODE_ENV === 'development' && event.level === 'debug') {
      return null;
    }
    
    if (event.exception && event.exception.values) {
      const error = event.exception.values[0];
      if (error.type === 'NetworkError' && error.value?.includes('fetch')) {
        return null;
      }
    }
    
    return event;
  },
  
  integrations: [
    ...(Sentry.getDefaultIntegrations({}) || []).filter(integration => {
      const name = integration?.name;
      return name && ['Console', 'Http', 'OnUncaughtException', 'OnUnhandledRejection'].includes(name);
    })
  ],
  
  maxBreadcrumbs: 10,
  maxValueLength: 250,
});

export { quotaService };
export const getSentryUsage = () => quotaService.getCurrentUsage();
export const disableSentry = () => {
  console.warn('🚫 Sentry désactivé manuellement');
  // Désactiver Sentry en supprimant le DSN
  process.env.SENTRY_DSN = '';
};
export const enableSentry = () => {
  console.log('✅ Sentry réactivé');
  // Réactiver Sentry en restaurant le DSN
  process.env.SENTRY_DSN = process.env.SENTRY_DSN_ORIGINAL;
};