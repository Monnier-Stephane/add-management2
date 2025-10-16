'use client'

import { useQuery } from "@tanstack/react-query"
import { api } from '../api/api'

interface Subscription {
  _id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  tarif: string
  statutPaiement?: string
}

export const useSubscriptions = () => {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.get<Subscription[]>('/subscriptions'),
    staleTime: 0, // Pas de cache pour les données en temps réel
    gcTime: 0, // Pas de cache du tout pour les données critiques
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // Recharger quand la fenêtre reprend le focus
    refetchOnMount: true, // Recharger à chaque montage
  })
}

export const useUniqueTarifs = () => {
  return useQuery({
    queryKey: ['tarifs', 'unique'],
    queryFn: () => api.get<string[]>('/subscriptions/tarifs/unique'),
    staleTime: 30 * 60 * 1000, // 30 minutes (tarifs changent rarement)
    gcTime: 60 * 60 * 1000, // 1 heure
    retry: 3,
  })
}
