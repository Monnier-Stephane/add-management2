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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://add-management2.onrender.com';
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
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  })
}

