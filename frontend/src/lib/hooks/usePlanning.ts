'use client'

import { useQuery } from "@tanstack/react-query"
import { api } from '../api/api'

interface PlanningAssignment {
  _id: string
  eventId: string
  coaches: string[]
  createdAt: string
  updatedAt: string
}

export const usePlanningAssignments = () => {
  return useQuery({
    queryKey: ['planning', 'assignments'],
    queryFn: () => api.get<PlanningAssignment[]>('/planning/assignments'),
    staleTime: 5 * 60 * 1000, // 5 minutes - synchronisé avec backend Redis
    gcTime: 10 * 60 * 1000, // 10 minutes - garde en mémoire plus longtemps
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Pas de rechargement automatique (cache cohérent)
    refetchOnMount: false, // Pas de rechargement à chaque montage (cache cohérent)
  })
}

export const useTodayCourses = (coachEmail?: string) => {
  const endpoint = coachEmail 
    ? `/planning/today-courses?coachEmail=${encodeURIComponent(coachEmail)}`
    : '/planning/today-courses'
    
  return useQuery({
    queryKey: ['planning', 'today-courses', coachEmail || 'all'],
    queryFn: () => api.get<any[]>(endpoint),
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, 
    refetchOnMount: false, 
  })
}
