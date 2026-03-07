'use client'


class ApiService {
  private readonly API_BASE = (() => {
    // En développement, toujours utiliser localhost
    if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3001';
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.warn('NEXT_PUBLIC_API_URL environment variable is not defined, using default');
      return 'http://localhost:3001';
    }
    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  })()

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
          // Construire le message d'erreur
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.json()
            if (errorData.message) {
              errorMessage = `${errorMessage} - ${errorData.message}`
            } else if (typeof errorData === 'string') {
              errorMessage = `${errorMessage} - ${errorData}`
            } else {
              errorMessage = `${errorMessage} - ${JSON.stringify(errorData)}`
            }
          } catch {
            // Si on ne peut pas parser la réponse, utiliser le texte brut
            try {
              const text = await response.text()
              if (text) {
                errorMessage = `${errorMessage} - ${text}`
              }
            } catch {
              // Ignorer si on ne peut pas lire le texte
            }
          }
          
          // Les erreurs 4xx (client errors) ne doivent jamais être retentées
          // Elles indiquent des problèmes de validation, ressources manquantes, etc.
          if (response.status >= 400 && response.status < 500) {
            throw new Error(errorMessage)
          }
          
          // Les erreurs 5xx (server errors) peuvent être retentées si ce n'est pas le dernier essai
          // Car elles peuvent être temporaires (serveur surchargé, erreur temporaire, etc.)
          if (response.status >= 500) {
            if (i === retries - 1) {
              // Dernier essai, lancer l'erreur
              throw new Error(errorMessage)
            }
            // Sinon, continuer la boucle pour réessayer
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
            continue
          }
          
          // Par défaut, lancer l'erreur
          throw new Error(errorMessage)
        }

        const data = await response.json()
        return data
      } catch (error) {
        // Si c'est une erreur HTTP 4xx, elle a déjà été lancée dans le bloc ci-dessus
        // Ici on ne gère que les erreurs réseau (pas de réponse, timeout, etc.)
        if (error instanceof Error && error.message.startsWith('HTTP 4')) {
          // Erreur client (4xx), ne pas retenter
          throw error
        }
        
        // Si c'est le dernier essai, lancer l'erreur
        if (i === retries - 1) {
          throw error
        }
        
        // Pour les erreurs réseau ou 5xx, attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
      }
    }
    throw new Error('Max retries exceeded')
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.fetchWithRetry<T>(endpoint)
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.fetchWithRetry<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

export const api = new ApiService()
