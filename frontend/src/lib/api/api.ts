'use client'

interface ApiResponse<T> {
  data: T
  timestamp: number
}

class ApiService {
  private readonly API_BASE = (() => {
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
