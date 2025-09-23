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
	<Card className="max-w-4xl my-5">
	<CardHeader>
	  <CardTitle>Liste des coaches</CardTitle>
	</CardHeader>
	<CardContent>
	  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
	    {filteredCoaches?.map((coach) => (
	      <div key={coach._id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
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
   )
}

export default CoachesList