'use client'
import { useCoaches } from '@/lib/hooks/useCoaches'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mail, Phone, X, User } from 'lucide-react'
import { useState } from 'react'

interface Coach {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  statut: 'coach' | 'admin';
}

const CoachesList = () => {
   const { data: coaches, isLoading, error } = useCoaches()
   const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)
   const [isDialogOpen, setIsDialogOpen] = useState(false)

   // Filtrer les coaches (exclure celui avec prénom "chau")
   const filteredCoaches = coaches?.filter(coach => 
     coach.prenom.toLowerCase() !== 'chau'
   )

   const handleCoachClick = (coach: Coach) => {
     setSelectedCoach(coach)
     setIsDialogOpen(true)
   }

   const handleCloseDialog = () => {
     setIsDialogOpen(false)
     setSelectedCoach(null)
   }

   const handleEmailClick = (email: string) => {
     window.open(`mailto:${email}`, '_blank')
   }

   const handlePhoneClick = (phone: string) => {
     window.open(`tel:${phone}`, '_blank')
   }

   if(isLoading) return <div>Chargement...</div>
   if(error) return <div>Erreur: {error.message}</div>

   return (
	<>
		<Card className="max-w-4xl my-5">
			<CardHeader>
				<CardTitle>Liste des coaches</CardTitle>
				<p className="text-sm text-gray-600 mt-1">
					{filteredCoaches?.length || 0} coaches
				</p>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{filteredCoaches?.map((coach) => (
						<div 
							key={coach._id} 
							className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
							onClick={() => handleCoachClick(coach)}
						>
							<div>
								<p className="font-medium">{coach.nom} {coach.prenom}</p>
								<p className="text-sm text-gray-600">{coach.email}</p>
								{coach.telephone && (
									<p className="text-sm text-gray-500">{coach.telephone}</p>
								)}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>

		{/* Popup avec les détails du coach */}
		<Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Informations du coach
					</DialogTitle>
				</DialogHeader>
				
				{selectedCoach && (
					<div className="space-y-4">
						{/* Nom et prénom */}
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<h3 className="text-xl font-bold text-gray-900">
								{selectedCoach.prenom} {selectedCoach.nom}
							</h3>
							<p className="text-sm text-gray-600 mt-1">
								{selectedCoach.statut === 'admin' ? 'Administrateur' : 'Coach'}
							</p>
						</div>

						{/* Email cliquable */}
						<div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
							<div className="flex items-center gap-3">
								<Mail className="h-5 w-5 text-blue-600" />
								<div>
									<p className="text-sm text-gray-600">Email</p>
									<p className="font-medium">{selectedCoach.email}</p>
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleEmailClick(selectedCoach.email)}
								className="flex items-center gap-2"
							>
								<Mail className="h-4 w-4" />
								Envoyer
							</Button>
						</div>

						{/* Téléphone cliquable */}
						{selectedCoach.telephone && (
							<div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
								<div className="flex items-center gap-3">
									<Phone className="h-5 w-5 text-green-600" />
									<div>
										<p className="text-sm text-gray-600">Téléphone</p>
										<p className="font-medium">{selectedCoach.telephone}</p>
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePhoneClick(selectedCoach.telephone!)}
									className="flex items-center gap-2"
								>
									<Phone className="h-4 w-4" />
									Appeler
								</Button>
							</div>
						)}

						{/* Message si pas de téléphone */}
						{!selectedCoach.telephone && (
							<div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
								<Phone className="h-5 w-5 text-gray-400" />
								<div>
									<p className="text-sm text-gray-600">Téléphone</p>
									<p className="text-sm text-gray-500">Non renseigné</p>
								</div>
							</div>
						)}

						{/* Bouton de fermeture */}
						<div className="flex justify-end pt-4 border-t">
							<Button onClick={handleCloseDialog} variant="outline">
								<X className="h-4 w-4 mr-2" />
								Fermer
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	</>
   )
}

export default CoachesList