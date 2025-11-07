'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pageCache } from '../cache/pageCache'

interface LazyDataOptions {
  page: string
  key: string
  queryFn: () => Promise<unknown>
  staleTime?: number
  gcTime?: number
}

export const useLazyData = ({ 
  page, 
  key, 
  queryFn, 
  staleTime = 5 * 60 * 1000, // 🚀 5 minutes par défaut (au lieu de 30 secondes)
  gcTime = 10 * 60 * 1000 // 10 minutes par défaut
}: LazyDataOptions) => {
  const queryClient = useQueryClient()
  const queryKey = [page, key]

  // Vérifier le cache localStorage d'abord
  const cachedData = pageCache.getPageData(page, key)
  
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await queryFn()
      // Sauvegarder dans le cache localStorage
      pageCache.setPageData(page, key, data)
      return data
    },
    staleTime,
    gcTime,
    enabled: false, // Ne pas charger automatiquement
    initialData: cachedData, // Utiliser les données du cache si disponibles
    refetchOnWindowFocus: false, // 🚀 Pas de rechargement automatique
    refetchOnMount: false, // 🚀 Pas de rechargement à chaque montage
  })

  // Fonction pour déclencher le chargement
  const loadData = async () => {
    if (!query.data && !query.isLoading) {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const data = await queryFn()
          pageCache.setPageData(page, key, data)
          return data
        },
        staleTime,
        gcTime,
      })
    }
  }

  // Fonction pour forcer le rechargement
  const refreshData = async () => {
    pageCache.clearPageData(page, key)
    await queryClient.invalidateQueries({ queryKey })
  }

  return {
    ...query,
    loadData,
    refreshData,
    isCached: !!cachedData
  }
}
