'use client'

interface ApiResponse<T> {
  data: T
  timestamp: number
}

class ApiService {
  private cache = new Map<string, ApiResponse<any>>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly API_BASE = 'http://localhost:3001'

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  private async fetchWithRetry<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    retries = 3
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${this.API_BASE}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
      }
    }
    throw new Error('Max retries exceeded')
  }

  async get<T>(endpoint: string, useCache = true): Promise<T> {
    const cacheKey = `GET:${endpoint}`
    
    // Vérifier le cache
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (this.isCacheValid(cached.timestamp)) {
        return cached.data
      }
    }

    // Faire l'appel API
    const data = await this.fetchWithRetry<T>(endpoint)
    
    // Mettre en cache
    if (useCache) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })
    }

    return data
  }

  async post<T>(endpoint: string, data: any, useCache = true): Promise<T> {
    const result = await this.fetchWithRetry<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    // Invalider le cache pour les endpoints liés
    if (useCache) {
      this.invalidateRelatedCache(endpoint)
    }

    return result
  }

  async patch<T>(endpoint: string, data: any, useCache = true): Promise<T> {
    const result = await this.fetchWithRetry<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })

    // Invalider le cache pour les endpoints liés
    if (useCache) {
      this.invalidateRelatedCache(endpoint)
    }

    return result
  }

  async delete<T>(endpoint: string, useCache = true): Promise<T> {
    const result = await this.fetchWithRetry<T>(endpoint, {
      method: 'DELETE',
    })

    // Invalider le cache pour les endpoints liés
    if (useCache) {
      this.invalidateRelatedCache(endpoint)
    }

    return result
  }

  private invalidateRelatedCache(endpoint: string): void {
    // Invalider les caches liés selon l'endpoint
    if (endpoint.includes('/subscriptions')) {
      this.cache.delete('GET:/subscriptions')
      this.cache.delete('GET:/subscriptions/tarifs/unique')
    }
    if (endpoint.includes('/coaches')) {
      this.cache.delete('GET:/coaches')
    }
    if (endpoint.includes('/planning')) {
      this.cache.delete('GET:/planning/assignments')
    }
  }

  // Méthode pour forcer le refresh d'un endpoint
  async refresh<T>(endpoint: string): Promise<T> {
    this.cache.delete(`GET:${endpoint}`)
    return this.get<T>(endpoint, true)
  }

  // Nettoyer le cache
  clearCache(): void {
    this.cache.clear()
  }
}

export const api = new ApiService()
