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
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, 
    refetchOnMount: false, 
  })
}

export const useUniqueTarifs = () => {
  return useQuery({
    queryKey: ['tarifs', 'unique'],
    queryFn: () => api.get<string[]>('/subscriptions/tarifs/unique'),
    staleTime: 30 * 60 * 1000, 
    gcTime: 60 * 60 * 1000, 
    retry: 3,
  })
}
