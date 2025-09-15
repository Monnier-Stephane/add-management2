'use client'

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useCoaches } from "@/lib/hooks/useCoaches";

const CoachesPage = () => {
  return (
    <ProtectedRoute>
      <CoachesContent />
    </ProtectedRoute>
  )
}

const CoachesContent = () => {
  const { data: coaches, isLoading, error } = useCoaches();

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Liste des coachs</h1>
      {coaches?.map((coach) => (
        <div key={coach._id}>
          <h2>{coach.nom} {coach.prenom}</h2>
          <p>{coach.email}</p>
          <p>{coach.statut}</p>
        </div>
      ))}
    </div>
  )
}

export default CoachesPage;