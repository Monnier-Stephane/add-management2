'use client'

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useCoaches } from "@/lib/hooks/useCoaches";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Save, X, Home, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface Coach {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  statut: 'coach' | 'admin';
}

const CoachesPage = () => {
  return (
    <ProtectedRoute>
      <CoachesContent />
    </ProtectedRoute>
  )
}

const CoachesContent = () => {
  const { data: coaches, isLoading, error } = useCoaches();
  const { userRole } = useAuth();
  const [editingCoach, setEditingCoach] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    statut: 'coach' as 'coach' | 'admin'
  });

  const isAdmin = userRole === 'admin';

  if (isLoading) return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <div>Chargement...</div>
      </div>
    </div>
  );
  if (error) return <div>Error: {error.message}</div>;

  // Filtrer les coaches (exclure celui avec prénom "chau")
  const filteredCoaches = coaches?.filter(coach => 
    coach.prenom.toLowerCase() !== 'chau'
  );

  // Trier par ordre alphabétique des prénoms
  const sortedCoaches = filteredCoaches?.sort((a, b) => 
    a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
  );

  const handleEdit = (coach: Coach) => {
    setEditingCoach(coach._id);
    setEditForm({
      nom: coach.nom,
      prenom: coach.prenom,
      email: coach.email,
      telephone: coach.telephone || '',
      statut: coach.statut
    });
  };

  const handleSave = async (coachId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
      }
      const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const response = await fetch(`${cleanApiUrl}/coaches/${coachId}`, {
        method: 'PATCH', // Changé de PUT à PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      // Fermer le modal d'édition et afficher la confirmation
      setEditingCoach(null);
      setShowSuccessModal(true);
      
      // Recharger les données après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      alert(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleCancel = () => {
    setEditingCoach(null);
    setEditForm({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      statut: 'coach'
    });
  };

  return (
    <div className="container mx-auto p-4 lg:max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestion des coaches</h1>
          <p className="text-gray-600">Gérez les informations des coaches</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 w-full md:w-auto">
            <Home className="h-4 w-4" />
            Retour au Dashboard
          </Button>
        </Link>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Liste des coaches</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            {sortedCoaches?.length || 0} coaches
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedCoaches?.map((coach) => (
              <div key={coach._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{coach.prenom} {coach.nom}</p>
                  <p className="text-sm text-gray-600">{coach.email}</p>
                  {coach.telephone && (
                    <p className="text-sm text-gray-500">{coach.telephone}</p>
                  )}
                  <p className="text-xs text-blue-600 font-medium">
                    {coach.statut === 'admin' ? 'Administrateur' : 'Coach'}
                  </p>
                </div>
                
                {isAdmin && (
                  <div className="flex gap-2">
                    {editingCoach === coach._id ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleSave(coach._id)}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(coach)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmation de succès */}
      {showSuccessModal && (
        <Dialog open={true} onOpenChange={() => setShowSuccessModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-green-600">✅ Coach mis à jour</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-gray-700">
                Les informations du coach ont été mises à jour avec succès !
              </p>
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => setShowSuccessModal(false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Parfait
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal d'édition */}
      {editingCoach && (
        <Dialog open={true} onOpenChange={handleCancel}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le coach</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={editForm.nom}
                  onChange={(e) => setEditForm({...editForm, nom: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({...editForm, prenom: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={editForm.telephone}
                  onChange={(e) => setEditForm({...editForm, telephone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={editForm.statut}
                  onValueChange={(value: 'coach' | 'admin') => setEditForm({...editForm, statut: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleSave(editingCoach)} className="flex-1">
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default CoachesPage;