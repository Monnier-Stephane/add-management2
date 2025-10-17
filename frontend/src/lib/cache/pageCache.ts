'use client'

interface PageCacheData {
  data: unknown
  timestamp: number
  page: string
}

class PageCacheService {
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(page: string, key: string): string {
    return `pageCache_${page}_${key}`
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  // Sauvegarder les données d'une page
  setPageData(page: string, key: string, data: unknown): void {
    try {
      const cacheData: PageCacheData = {
        data,
        timestamp: Date.now(),
        page
      }
      localStorage.setItem(this.getCacheKey(page, key), JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du cache:', error)
    }
  }

  // Récupérer les données d'une page
  getPageData(page: string, key: string): unknown | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(page, key))
      if (!cached) return null

      const cacheData: PageCacheData = JSON.parse(cached)
      
      if (!this.isCacheValid(cacheData.timestamp)) {
        this.clearPageData(page, key)
        return null
      }

      return cacheData.data
    } catch (error) {
      console.warn('Erreur lors de la récupération du cache:', error)
      return null
    }
  }

  // Nettoyer les données d'une page
  clearPageData(page: string, key: string): void {
    try {
      localStorage.removeItem(this.getCacheKey(page, key))
    } catch (error) {
      console.warn('Erreur lors du nettoyage du cache:', error)
    }
  }

  // Nettoyer toutes les données d'une page
  clearPage(page: string): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(`pageCache_${page}_`)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Erreur lors du nettoyage du cache de la page:', error)
    }
  }

  // Nettoyer tout le cache
  clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('pageCache_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Erreur lors du nettoyage du cache:', error)
    }
  }

  // Obtenir les statistiques du cache
  getCacheStats(): { totalKeys: number; pages: string[] } {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter(key => key.startsWith('pageCache_'))
      const pages = [...new Set(cacheKeys.map(key => key.split('_')[1]))]
      
      return {
        totalKeys: cacheKeys.length,
        pages
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des statistiques:', error)
      return { totalKeys: 0, pages: [] }
    }
  }
}

export const pageCache = new PageCacheService()
