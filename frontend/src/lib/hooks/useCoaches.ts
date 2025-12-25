'use client'

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from '../api/api'

interface Coach {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  statut: 'coach' | 'admin';
}

async function getCoaches(): Promise<Coach[]> {
  return api.get<Coach[]>('/coaches');
}

export const useCoaches = () => {
  const query = useQuery({
    queryKey: ['coaches'],
    queryFn: getCoaches,
    staleTime: 30 * 1000, // 30 secondes - données fraîches
    gcTime: 5 * 60 * 1000, // 5 minutes - garde en mémoire
    placeholderData: keepPreviousData,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // Recharger au focus
    refetchOnMount: true, // Recharger si nécessaire
  });

  // Log supplémentaire quand les données changent
  useEffect(() => {
    if (query.data) {
      console.log('🔄 Données coaches mises à jour:');
    }
  }, [query.data]);

  return query;
}

