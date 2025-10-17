'use client'

import { useQuery, keepPreviousData } from "@tanstack/react-query";

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
  return useQuery({
    queryKey: ['coaches'],
    queryFn: getCoaches,
    staleTime: 5 * 60 * 1000, // 5 minutes - synchronisé avec backend Redis
    gcTime: 10 * 60 * 1000, // 10 minutes - garde en mémoire plus longtemps
    placeholderData: keepPreviousData,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Pas de rechargement automatique (cache cohérent)
    refetchOnMount: false, // Pas de rechargement à chaque montage (cache cohérent)
  })
}

