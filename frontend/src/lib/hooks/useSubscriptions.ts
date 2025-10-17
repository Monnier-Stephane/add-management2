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
    staleTime: 30 * 1000, // 30 secondes - données fraîches
    gcTime: 5 * 60 * 1000, // 5 minutes - garde en mémoire
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // Recharger au focus
    refetchOnMount: true, // Recharger si nécessaire
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
