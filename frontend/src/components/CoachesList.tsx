'use client'
import { useCoaches } from '@/lib/hooks/useCoaches'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


const CoachesList = () => {
   const { data: coaches, isLoading, error } = useCoaches()

   // Filtrer les coaches (exclure celui avec prénom "chau")
   const filteredCoaches = coaches?.filter(coach => 
     coach.prenom.toLowerCase() !== 'chau'
   )

   if(isLoading) return <div>Chargement...</div>
   if(error) return <div>Erreur: {error.message}</div>

   return (
	<Card>
	<CardHeader>
	  <CardTitle>Liste des coaches</CardTitle>
	</CardHeader>
	<CardContent>
	  <div className="space-y-2">
	    {filteredCoaches?.map((coach) => (
	      <div key={coach._id} className="flex justify-between items-center p-2 border rounded">
	        <div>
	          <p className="font-medium">{coach.nom} {coach.prenom}</p>
	          <p className="text-sm text-gray-600">{coach.email}</p>
	        </div>
	        <span className={`px-2 py-1 rounded text-xs ${
	          coach.statut === 'admin' 
	            ? 'bg-red-100 text-red-800' 
	            : 'bg-blue-100 text-blue-800'
	        }`}>
	          {coach.statut}
	        </span>
	      </div>
	    ))}
	  </div>
	</CardContent>
            </Card>	
   )
}

export default CoachesList