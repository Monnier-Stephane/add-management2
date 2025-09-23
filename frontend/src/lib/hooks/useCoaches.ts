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
  const response = await fetch('http://localhost:3001/coaches');
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
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}

