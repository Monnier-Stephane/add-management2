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
          throw new Error(errorMessage)
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
