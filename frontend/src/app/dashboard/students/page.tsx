'use client'

import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Home, Phone, MapPin, CreditCard, FileText } from "lucide-react";
import Link from "next/link";

interface Student {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  telephoneUrgence?: string;
  dateDeNaissance: string;
  adresse: string;
  ville: string;
  codePostal: string;
  tarif: string;
  dateInscription: string;
  statutPaiement: 'payé' | 'en attente' | 'annulé';
  remarques?: string;
  // Champs pour les cours (à ajouter au backend)
  jour?: string;
  lieu?: string;
  heure?: string;
}

const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uniqueTarifs, setUniqueTarifs] = useState<string[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Ajouter un état pour gérer l'onglet actif par cours
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les élèves et les tarifs uniques en parallèle
        const [studentsResponse, tarifsResponse] = await Promise.all([
          fetch('http://localhost:3001/subscriptions'),
          fetch('http://localhost:3001/subscriptions/tarifs/unique')
        ]);
        
        if (!studentsResponse.ok || !tarifsResponse.ok) {
          throw new Error(`HTTP Error: ${studentsResponse.status}`);
        }
        
        const [studentsData, tarifsData] = await Promise.all([
          studentsResponse.json(),
          tarifsResponse.json()
        ]);
        
        setStudents(studentsData);
        setUniqueTarifs(tarifsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Vérifier si la date est valide
    if (isNaN(birthDate.getTime())) {
      
      return 0; // Retourner 0 pour les dates invalides (sera classé comme enfant)
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Vérifier si l'âge est raisonnable (entre 0 et 120 ans)
    if (age < 0 || age > 120) {
     
      return 0; // Retourner 0 pour les âges invalides
    }
    
    return age;
  };

  // Function to categorize students by age
  const categorizeByAge = (student: Student): string => {
    // PRIORITÉ 1: Utiliser le tarif qui contient l'information d'âge
    const tarif = (student.tarif || '').toLowerCase();
    
    // Logique basée sur le tarif (plus fiable que les dates corrompues)
    if (tarif.includes('enfant') || tarif.includes('5 à 8') || tarif.includes('9 à 11') || tarif.includes('7 à 11')) {
      return 'enfants';
    }
    if (tarif.includes('ado') || tarif.includes('10 à 17') || tarif.includes('11 à 17') || tarif.includes('12 à 17')) {
      return 'adolescents';
    }
    if (tarif.includes('adulte') || tarif.includes('18 à 20') || tarif.includes('jeunes adultes')) {
      return 'adultes';
    }
    
    // FALLBACK: Essayer de calculer l'âge si le tarif n'est pas clair
    const age = calculateAge(student.dateDeNaissance);
    
    
    if (age > 0 && age < 12) return 'enfants';
    if (age >= 12 && age < 18) return 'adolescents';
    if (age >= 18) return 'adultes';
    
    // Dernier recours: par défaut
    return 'enfants';
  };

  // Function to get course key (jour + lieu + heure)
  const getCourseKey = (student: Student): string => {
    const jour = student.jour || 'Non défini';
    const lieu = student.lieu || 'Non défini';
    const heure = student.heure || 'Non défini';
    return `${jour} - ${lieu} - ${heure}`;
  };

  const filterStudents = (students: Student[], searchTerm: string) => {
    if (!searchTerm) return students;
    
    const term = searchTerm.toLowerCase().trim();
    return students.filter(student => 
      student.nom.toLowerCase().includes(term) ||
      student.prenom.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term)
    );
  };

  // Ajouter cette logique après la ligne 155 (après filterStudents) :
  // Filter students first based on search term
  const filteredStudents = filterStudents(students, searchTerm);

  // Group filtered students by course, then by age category within each course
  const studentsByCourse: Record<string, { enfants: Student[], adolescents: Student[], adultes: Student[] }> = {};
  
  filteredStudents.forEach(student => {
    const courseKey = getCourseKey(student);
    const ageCategory = categorizeByAge(student);
    
    if (!studentsByCourse[courseKey]) {
      studentsByCourse[courseKey] = {
        enfants: [],
        adolescents: [],
        adultes: []
      };
    }
    
    studentsByCourse[courseKey][ageCategory as keyof typeof studentsByCourse[typeof courseKey]].push(student);
  });

  // Sort each age category alphabetically by first name within each course
  Object.keys(studentsByCourse).forEach(courseKey => {
    studentsByCourse[courseKey].enfants.sort((a, b) => 
      a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
    );
    studentsByCourse[courseKey].adolescents.sort((a, b) => 
      a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
    );
    studentsByCourse[courseKey].adultes.sort((a, b) => 
      a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
    );
  });

  // Ajouter cette définition juste avant la fonction getActiveTabForCourse (vers la ligne 192)
  // Define age categories for display
  const ageCategories = [
    { key: 'enfants', label: 'Enfants (0-11 ans)', color: 'bg-blue-50 border-blue-200' },
    { key: 'adolescents', label: 'Adolescents (12-17 ans)', color: 'bg-green-50 border-green-200' },
    { key: 'adultes', label: 'Adultes (18+ ans)', color: 'bg-purple-50 border-purple-200' }
  ];

  // Ajouter la fonction getActiveTabForCourse après la création de studentsByCourse
  const getActiveTabForCourse = (courseKey: string) => {
    if (!searchTerm) return ageCategories[0].key;
    
    const courseStudents = studentsByCourse[courseKey];
    
    // Vérifier dans quel ordre chercher les catégories
    for (const category of ageCategories) {
      const studentsInCategory = courseStudents[category.key as keyof typeof courseStudents];
      if (studentsInCategory.length > 0) {
        return category.key;
      }
    }
    
    return ageCategories[0].key;
  };

  // Fonction pour ouvrir le modal d'informations
  const handleShowInfo = (student: Student) => {
    setSelectedStudent(student);
    setIsInfoModalOpen(true);
  };

  // Fonction pour ouvrir le modal d'édition
  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      nom: student.nom,
      prenom: student.prenom,
      email: student.email,
      telephone: student.telephone,
      telephoneUrgence: student.telephoneUrgence || '',
      adresse: student.adresse,
      ville: student.ville,
      codePostal: student.codePostal,
      tarif: student.tarif,
      statutPaiement: student.statutPaiement,
      remarques: student.remarques || '',
      jour: student.jour || '',
      lieu: student.lieu || '',
      heure: student.heure || ''
    });
    setIsEditModalOpen(true);
  };

  // Fonction pour sauvegarder les modifications
  const handleSave = async () => {
    if (!editingStudent) return;

    // Confirmation avant sauvegarde
    const studentName = `${editingStudent.prenom} ${editingStudent.nom}`;
    const confirmMessage = `Êtes-vous sûr de vouloir sauvegarder les modifications pour ${studentName} ?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/subscriptions/${editingStudent._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // Mettre à jour la liste des élèves
      const updatedStudents = students.map(student => 
        student._id === editingStudent._id 
          ? { ...student, ...editForm }
          : student
      );
      setStudents(updatedStudents);
      
      // Message de succès
      alert(`✅ Les modifications pour ${studentName} ont été sauvegardées avec succès !`);
      
      setIsEditModalOpen(false);
      setEditingStudent(null);
    } catch (err) {
      console.error('Error updating student:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      alert('❌ Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  // Fonction pour supprimer un élève
  const handleDelete = async (studentId: string) => {
    // Trouver l'élève à supprimer pour afficher son nom
    const studentToDelete = students.find(student => student._id === studentId);
    if (!studentToDelete) return;

    const studentName = `${studentToDelete.prenom} ${studentToDelete.nom}`;
    
    // Double confirmation pour la suppression
    const firstConfirm = confirm(`⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer définitivement l'élève :\n${studentName}\n\nCette action est IRRÉVERSIBLE !\n\nVoulez-vous continuer ?`);
    
    if (!firstConfirm) {
      return;
    }

    // Deuxième confirmation
    const secondConfirm = confirm(`DERNIÈRE CONFIRMATION\n\nÊtes-vous ABSOLUMENT SÛR de vouloir supprimer ${studentName} ?\n\nToutes les données de cet élève seront perdues définitivement.`);
    
    if (!secondConfirm) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/subscriptions/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // Mettre à jour la liste des élèves
      const updatedStudents = students.filter(student => student._id !== studentId);
      setStudents(updatedStudents);
      
      // Message de confirmation
      alert(`✅ L'élève ${studentName} a été supprimé avec succès.`);
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      alert('❌ Erreur lors de la suppression. Veuillez réessayer.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 max-w-7xl mx-auto">
        <h1>Chargement des élèves...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 max-w-7xl mx-auto">
        <h1>Erreur</h1>
        <p>Erreur lors du chargement des élèves : {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          Liste des élèves par cours
        </h1>
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2 w-full md:w-auto">
            <Home className="h-4 w-4" />
            Retour au Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un élève..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      {students.length > 0 ? (
        <div className="space-y-6">
          {Object.keys(studentsByCourse).length > 0 ? (
            Object.keys(studentsByCourse).map((courseKey) => {
            const courseStudents = studentsByCourse[courseKey];
            const activeTab = activeTabs[courseKey] || getActiveTabForCourse(courseKey);
            const studentsInActiveCategory = courseStudents[activeTab as keyof typeof courseStudents].length;
            
            return (
              <div key={courseKey} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center justify-end mb-6">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {studentsInActiveCategory} élève{studentsInActiveCategory > 1 ? 's' : ''} {searchTerm ? 'trouvé' + (studentsInActiveCategory > 1 ? 's' : '') : ''}
                    </span>
                  </div>
                  
                  <Tabs 
                    value={activeTabs[courseKey] || getActiveTabForCourse(courseKey)} 
                    onValueChange={(value) => setActiveTabs(prev => ({ ...prev, [courseKey]: value }))}
                    className="w-full"
                  >
                    <TabsList className="flex flex-col sm:grid sm:grid-cols-3 gap-2 mb-12">
                      {ageCategories.map((ageCategory) => {
                        const studentsInCategory = courseStudents[ageCategory.key as keyof typeof courseStudents];
                        
                        return (
                          <TabsTrigger 
                            key={ageCategory.key} 
                            value={ageCategory.key}
                            className={`${ageCategory.color} border-2 w-full py-4 px-4 text-center`}
                          >
                            {ageCategory.label} ({studentsInCategory.length})
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                    
                    {ageCategories.map((ageCategory) => {
                      const studentsInCategory = courseStudents[ageCategory.key as keyof typeof courseStudents];
                      
                      return (
                        <TabsContent key={ageCategory.key} value={ageCategory.key}>
                          <div className={`rounded-lg border-2 p-4 mt-16 ${ageCategory.color}`}>
                            {studentsInCategory.length > 0 ? (
                              <>
                                {/* Version desktop - Tableau */}
                                <div className="hidden md:block">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Prénom</TableHead>
                                        <TableHead>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {studentsInCategory.map((student) => (
                                        <TableRow key={student._id}>
                                          <TableCell 
                                            className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                                            onClick={() => handleShowInfo(student)}
                                          >
                                            {student.nom}
                                          </TableCell>
                                          <TableCell 
                                            className="cursor-pointer hover:text-blue-600 hover:underline"
                                            onClick={() => handleShowInfo(student)}
                                          >
                                            {student.prenom}
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(student)}
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(student._id)}
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                {/* Version mobile - Cards */}
                                <div className="md:hidden space-y-3">
                                  {studentsInCategory.map((student) => (
                                    <div 
                                      key={student._id}
                                      className="bg-white border rounded-lg p-4 shadow-sm"
                                    >
                                      <div 
                                        className="cursor-pointer hover:text-blue-600"
                                        onClick={() => handleShowInfo(student)}
                                      >
                                        <h4 className="font-semibold text-sm">
                                          {student.prenom} {student.nom}
                                        </h4>
                                      </div>
                                      <div className="flex gap-2 mt-3 justify-end">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEdit(student)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDelete(student._id)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <p>Aucun élève dans cette catégorie</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </div>
              </div>
            );
          })) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
              <p className="text-lg text-gray-500">
                Aucun élève trouvé pour &quot;{searchTerm}&quot;
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
          <p className="text-lg text-gray-500">
            Aucun élève trouvé
          </p>
        </div>
      )}

      {/* Modal d'informations détaillées */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Informations de l&apos;élève</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nom</Label>
                  <p className="text-lg font-semibold">{selectedStudent.nom}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Prénom</Label>
                  <p className="text-lg font-semibold">{selectedStudent.prenom}</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-base">{selectedStudent.email || "Non renseigné"}</p>
              </div>

              {/* Téléphones */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  {selectedStudent.telephone ? (
                    <a 
                      href={`tel:${selectedStudent.telephone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {selectedStudent.telephone}
                    </a>
                  ) : (
                    <p className="text-gray-500">Non renseigné</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone d&apos;urgence
                  </Label>
                  {selectedStudent.telephoneUrgence ? (
                    <a 
                      href={`tel:${selectedStudent.telephoneUrgence}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {selectedStudent.telephoneUrgence}
                    </a>
                  ) : (
                    <p className="text-gray-500">Non renseigné</p>
                  )}
                </div>
              </div>

              {/* Adresse */}
              <div>
                <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </Label>
                <div className="space-y-1">
                  <p className="text-base">{selectedStudent.adresse}</p>
                  <p className="text-base">{selectedStudent.codePostal} {selectedStudent.ville}</p>
                </div>
              </div>

              {/* Statut de paiement */}
              <div>
                <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Statut de paiement
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedStudent.statutPaiement === 'payé' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedStudent.statutPaiement === 'en attente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedStudent.statutPaiement}
                  </span>
                </div>
              </div>

              {/* Remarques */}
              {selectedStudent.remarques && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Remarques
                  </Label>
                  <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedStudent.remarques}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsInfoModalOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;élève</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom" className="mb-2 block">Nom</Label>
              <Input
                id="nom"
                value={editForm.nom || ''}
                onChange={(e) => setEditForm({...editForm, nom: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="prenom" className="mb-2 block">Prénom</Label>
              <Input
                id="prenom"
                value={editForm.prenom || ''}
                onChange={(e) => setEditForm({...editForm, prenom: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="telephone" className="mb-2 block">Téléphone</Label>
              <Input
                id="telephone"
                value={editForm.telephone || ''}
                onChange={(e) => setEditForm({...editForm, telephone: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="telephoneUrgence" className="mb-2 block">Téléphone d&apos;urgence</Label>
              <Input
                id="telephoneUrgence"
                value={editForm.telephoneUrgence || ''}
                onChange={(e) => setEditForm({...editForm, telephoneUrgence: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="adresse" className="mb-2 block">Adresse</Label>
              <Input
                id="adresse"
                value={editForm.adresse || ''}
                onChange={(e) => setEditForm({...editForm, adresse: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="ville" className="mb-2 block">Ville</Label>
              <Input
                id="ville"
                value={editForm.ville || ''}
                onChange={(e) => setEditForm({...editForm, ville: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="codePostal" className="mb-2 block">Code postal</Label>
              <Input
                id="codePostal"
                value={editForm.codePostal || ''}
                onChange={(e) => setEditForm({...editForm, codePostal: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="tarif" className="mb-2 block">Tarif</Label>
              <Select
                value={editForm.tarif || ''}
                onValueChange={(value: string) => setEditForm({...editForm, tarif: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un tarif" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTarifs.map((tarif) => (
                    <SelectItem key={tarif} value={tarif}>
                      {tarif}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="statutPaiement" className="mb-2 block">Statut de paiement</Label>
              <Select
                value={editForm.statutPaiement || ''}
                onValueChange={(value: string) => setEditForm({...editForm, statutPaiement: value as 'payé' | 'en attente' | 'annulé'})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payé">Payé</SelectItem>
                  <SelectItem value="en attente">En attente</SelectItem>
                  <SelectItem value="annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
          </div>
          
          <div className="mt-4">
              <Label htmlFor="remarques" className="mb-2 block">Remarques</Label>
            <Input
              id="remarques"
              value={editForm.remarques || ''}
              onChange={(e) => setEditForm({...editForm, remarques: e.target.value})}
            />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;
