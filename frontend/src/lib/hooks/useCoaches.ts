'use client'

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect } from "react";

interface Coach {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  statut: 'coach' | 'admin';
}

async function getCoaches(): Promise<Coach[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
  }
  const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const response = await fetch(`${cleanApiUrl}/coaches`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  
 
  return data;
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

