'use client'

import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

interface LazyNavigationProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetchData?: () => Promise<void>
}

export const LazyNavigation = ({ href, children, className, prefetchData }: LazyNavigationProps) => {
  const router = useRouter()
  

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Précharger les données si nécessaire
    if (prefetchData) {
      try {
        await prefetchData()
      } catch (error) {
        console.warn('Erreur lors du préchargement:', error)
      }
    }

    // Naviguer vers la page
    router.push(href)
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}

// Hook pour précharger les données d'une page
export const usePrefetchPageData = () => {
  const queryClient = useQueryClient()

  const prefetchPlanning = async () => {
    // Précharger les coaches pour la page planning
    await queryClient.prefetchQuery({
      queryKey: ['coaches'],
      queryFn: async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) throw new Error('API URL not defined');
        const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        const response = await fetch(`${cleanApiUrl}/coaches`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 🚀 5 minutes (au lieu de 30 secondes)
      gcTime: 10 * 60 * 1000, // 10 minutes
    })

    // Précharger les assignations de planning
    await queryClient.prefetchQuery({
      queryKey: ['planningAssignments'],
      queryFn: async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) throw new Error('API URL not defined');
        const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        const response = await fetch(`${cleanApiUrl}/planning/assignments`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 🚀 5 minutes (au lieu de 30 secondes)
      gcTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  const prefetchCoaches = async () => {
    // Précharger les coaches pour la page coaches
    await queryClient.prefetchQuery({
      queryKey: ['coaches'],
      queryFn: async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) throw new Error('API URL not defined');
        const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        const response = await fetch(`${cleanApiUrl}/coaches`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 🚀 5 minutes (au lieu de 30 secondes)
      gcTime: 10 * 60 * 1000, // 10 minutes
    })
  }

  return {
    prefetchPlanning,
    prefetchCoaches
  }
}
