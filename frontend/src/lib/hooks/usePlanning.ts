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

interface TodayCourse {
  id: string
  name: string
  time: string
  students: number
  location: string
  coachId: string
  coachName: string
  coachEmail: string
  date: string
  assignedCoaches?: string[]
}

export const usePlanningAssignments = () => {
  return useQuery({
    queryKey: ['planning', 'assignments'],
    queryFn: () => api.get<PlanningAssignment[]>('/planning/assignments'),
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, 
    refetchOnMount: false, 
  })
}

export const useTodayCourses = (coachEmail?: string) => {
  const endpoint = coachEmail 
    ? `/planning/today-courses?coachEmail=${encodeURIComponent(coachEmail)}`
    : '/planning/today-courses'
    
  return useQuery({
    queryKey: ['planning', 'today-courses', coachEmail || 'all'],
    queryFn: () => api.get<TodayCourse[]>(endpoint),
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, 
    refetchOnMount: false, 
  })
}
