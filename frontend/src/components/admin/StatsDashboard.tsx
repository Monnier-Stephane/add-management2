'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { ChevronDown, ChevronUp, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSubscriptions } from '@/lib/hooks/useSubscriptions';
import { useQueryClient } from '@tanstack/react-query';

const COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];

interface Student {
  _id: string;
  nom: string;
  prenom: string;
  statutPaiement?: string;
  tarif: string;
  email?: string;
  telephone?: string;
}

export default function StatsDashboard() {
  const { userRole } = useAuth();
  const [showPendingDetails, setShowPendingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const queryClient = useQueryClient();
  
  // Utiliser le hook optimisé avec chargement parallèle
  const { data: students, isLoading, error, refetch } = useSubscriptions();
  
  // Précharger les données critiques en arrière-plan
  useEffect(() => {
    // Précharger les données si elles ne sont pas en cache
    if (!students && !isLoading) {
      refetch();
    }
  }, [students, isLoading, refetch]);
  
  
  const isAdmin = userRole === 'admin';

  // Calculer les statistiques à partir des données
  const stats = students && Array.isArray(students) ? (() => {
    const total = students.length;
    let attente = 0, paye = 0, enfants = 0, ados = 0, adultes = 0;
    const pendingList: Student[] = [];

    students.forEach((item: Student) => {
      // Payment status
      if (item.statutPaiement === 'en attente') {
        attente++;
        pendingList.push(item);
      }
      if (item.statutPaiement === 'payé') paye++;

      // Categorization by pricing tier
      const tarif = (item.tarif || '').toLowerCase();
      if (tarif.includes('enfant')) enfants++;
      else if (tarif.includes('ado')) ados++;
      else if (tarif.includes('adulte')) adultes++;
    });

    return { total, attente, paye, enfants, ados, adultes };
  })() : { total: 0, attente: 0, paye: 0, enfants: 0, ados: 0, adultes: 0 };

  


  // Filtrer les élèves en attente avec vérification supplémentaire
  const pendingStudents = students && Array.isArray(students) ? 
    students.filter((item: Student) => item.statutPaiement === 'en attente') : [];

  // Debug: Afficher les données pour vérifier
  

  const paiementData = [
    { name: 'En attente', value: stats.attente },
    { name: 'Payé', value: stats.paye },
  ];

  const ageData = [
    { name: 'Enfants', value: stats.enfants },
    { name: 'Adolescents', value: stats.ados },
    { name: 'Adultes', value: stats.adultes },
  ];

  // Fonction pour marquer un élève comme payé
  const handleMarkAsPaid = async (studentId: string) => {
    try {
      setIsUpdating(studentId);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
      }
      
      const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const response = await fetch(`${cleanApiUrl}/subscriptions/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ statutPaiement: 'payé' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      // Forcer le rechargement immédiat des données
      await refetch();
      
      // Invalider toutes les queries liées aux subscriptions
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      
      // Forcer un refetch immédiat
      await queryClient.refetchQueries({ queryKey: ['subscriptions'] });
      
      // Afficher la popup de confirmation
      setShowSuccessModal(true);
      
      // Masquer la popup après 3 secondes
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert(`Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-lg">Chargement des statistiques...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-600">Erreur: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Popup de confirmation */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <div className="flex items-center gap-3 text-green-600">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Succès !</h3>
                <p className="text-sm text-gray-600">Le statut de paiement a été mis à jour</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug info - Toujours visible pour debug */}
      <div className="bg-blue-50 p-4 rounded-lg border">
        <div className="text-sm text-blue-800">
          Debug - Rôle: {userRole} | Admin: {isAdmin ? 'Oui' : 'Non'} | Total: {stats.total} | En attente: {stats.attente} | Payé: {stats.paye}
        </div>
      </div>
      
      {/* Key metrics tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Total d&apos;adhérents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-4xl font-bold text-primary py-2">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Enfants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-4xl font-bold text-green-500 py-2">{stats.enfants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Adolescents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-4xl font-bold text-blue-500 py-2">{stats.ados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Adultes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-4xl font-bold text-yellow-500 py-2">{stats.adultes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending payments section - Seulement pour les admins */}
      {isAdmin && stats.attente > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                Paiements en attente ({stats.attente})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPendingDetails(!showPendingDetails)}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                {showPendingDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Masquer les détails</span>
                    <span className="sm:hidden">Masquer</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Voir les détails</span>
                    <span className="sm:hidden">Voir</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showPendingDetails && (
            <CardContent>
              <div className="space-y-3">
                {pendingStudents
                  .sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' }))
                  .map((student) => (
                  <div
                    key={student._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-3 bg-white rounded-lg border border-orange-200"
                  >
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg p-3 flex items-center justify-center flex-shrink-0 shadow-sm">
  <Users className="h-5 w-5 text-orange-700" />
</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {student.prenom} {student.nom}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {student.email && (
                            <div className="break-words">📧 {student.email}</div>
                          )}
                          {student.telephone && (
                            <div className="truncate">📞 {student.telephone}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                    <Badge 
  variant="outline" 
  className="text-orange-600 border-orange-300 text-xs sm:text-sm w-fit rounded-md px-3 py-1"
>
  <span className="max-w-[140px] sm:max-w-none text-wrap">
    {student.tarif}
  </span>
</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full sm:w-auto text-xs sm:text-sm"
                        onClick={() => handleMarkAsPaid(student._id)}
                        disabled={isUpdating === student._id}
                      >
                        {isUpdating === student._id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Mise à jour...
                          </>
                        ) : (
                          'Marquer comme payé'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Pie charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment status - Visible pour tous pour debug */}
        <Card>
          <CardHeader>
            <CardTitle>Statut de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paiementData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {paiementData.map((entry, index) => (
                    <Cell key={`cell-paiement-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution by category */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-age-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
