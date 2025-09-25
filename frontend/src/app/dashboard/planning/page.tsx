'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Grid3X3, List, Plus, X, Users, Home, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useCoaches } from '@/lib/hooks/useCoaches';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/fr';
import { useAuth } from '@/lib/auth/AuthContext';

// Configuration de moment en français
moment.locale('fr');

// Configuration du localizer pour les dates
const localizer = momentLocalizer(moment);

// Interface pour les événements
interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    color: string;
    coaches: string[];
  };
}

// Interface pour les coaches (utilise la même que dans useCoaches)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Coach {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: 'coach' | 'admin';
}

// Couleurs pour les coaches
const COACH_COLORS = [
  '#ef4444', // rouge
  '#f97316', // orange
  '#eab308', // jaune
  '#22c55e', // vert
  '#06b6d4', // cyan
  '#3b82f6', // bleu
  '#8b5cf6', // violet
  '#ec4899', // rose
  '#84cc16', // lime
  '#f59e0b', // amber
];

export default function PlanningPage() {
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCoachName, setNewCoachName] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [coachColors, setCoachColors] = useState<Record<string, string>>({});
  const [showSaturdayView, setShowSaturdayView] = useState(false);
  const [showMyPlanning, setShowMyPlanning] = useState(false); // Nouveau state

  // Récupérer les coaches depuis MongoDB
  const { data: coaches, isLoading: coachesLoading } = useCoaches();
  
  // Récupérer les informations de l'utilisateur connecté
  const { userRole, userProfile } = useAuth();
  const isCoach = userRole === 'coach';

  // Filtrer les événements pour le coach connecté
  const getMyEvents = () => {
    if (!userProfile || !isCoach) return events;
    
    const myName = `${userProfile.prenom} ${userProfile.nom}`;
    return events.filter(event => 
      event.resource?.coaches.includes(myName)
    );
  };

  // Événements à afficher selon le mode
  const displayEvents = showMyPlanning ? getMyEvents() : events;

  // Générer les événements récurrents pour chaque semaine
  const generateRecurringEvents = (): Event[] => {
    const eventsList: Event[] = [];
    const currentDate = new Date();
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const endOfYear = new Date(currentDate.getFullYear(), 11, 31);

    // Fonction pour générer des événements récurrents
    const addRecurringEvent = (
      dayOfWeek: number,
      hour: number,
      minute: number,
      title: string,
      color: string
    ) => {
      const date = new Date(startOfYear);
      // Trouver le premier jour de la semaine
      while (date.getDay() !== dayOfWeek) {
        date.setDate(date.getDate() + 1);
      }

      while (date <= endOfYear) {
        const start = new Date(date);
        start.setHours(hour, minute, 0, 0);
        const end = new Date(start);
        end.setHours(hour + 1, minute, 0, 0);

        eventsList.push({
          id: `${title}-${date.getTime()}`,
          title,
          start,
          end,
          resource: { 
            color,
            coaches: [] // Liste vide au début
          }
        });

        date.setDate(date.getDate() + 7);
      }
    };

    // Ajouter tous les cours
    addRecurringEvent(1, 19, 30, 'Lundi 19h30 - Bercy', '#fbbf24');
    addRecurringEvent(3, 12, 15, 'Mercredi 12h15 - Châtelet', '#3b82f6');
    addRecurringEvent(3, 16, 15, 'Mercredi 16h15 - Châtelet', '#3b82f6');
    addRecurringEvent(4, 18, 0, 'Jeudi 18h - Châtelet', '#3b82f6');
    addRecurringEvent(4, 19, 30, 'Jeudi 19h30 - Châtelet', '#3b82f6');
    addRecurringEvent(6, 10, 0, 'Samedi 10h - Châtelet', '#3b82f6');
    addRecurringEvent(6, 11, 15, 'Samedi 11h15 - Châtelet', '#3b82f6');
    addRecurringEvent(6, 12, 15, 'Samedi 12h15 - Châtelet', '#3b82f6');
    addRecurringEvent(6, 16, 30, 'Samedi 16h30 - Choisy', '#10b981');
    addRecurringEvent(6, 17, 45, 'Samedi 17h45 - Choisy', '#10b981');
    addRecurringEvent(0, 10, 0, 'Dimanche 10h - Choisy', '#10b981');
    addRecurringEvent(0, 11, 30, 'Dimanche 11h30 - Choisy', '#10b981');

    return eventsList;
  };

  // Initialiser les événements et assigner des couleurs aux coaches
  useEffect(() => {
    setEvents(generateRecurringEvents());
    
    if (coaches) {
      const colors: Record<string, string> = {};
      coaches.forEach((coach, index) => {
        colors[coach._id] = COACH_COLORS[index % COACH_COLORS.length];
      });
      setCoachColors(colors);
    }
  }, [coaches]);

  // Charger les assignations au démarrage
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://add-management2.onrender.com';
        const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        const response = await fetch(`${cleanApiUrl}/planning/assignments`);
        if (response.ok) {
          const assignments = await response.json();
          
          // Vérifier que assignments est un tableau
          if (Array.isArray(assignments)) {
            // Appliquer les assignations aux événements
            setEvents(prev => prev.map(event => {
              const assignment = assignments.find((a: { eventId: string; coaches: string[] }) => a.eventId === event.id);
              return assignment ? {
                ...event,
                resource: {
                  ...event.resource!,
                  coaches: assignment.coaches || []
                }
              } : event;
            }));
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des assignations:', error);
      }
    };

    // Charger les assignations après que les événements soient générés
    if (events.length > 0) {
      loadAssignments();
    }
  }, [events.length]); // Déclencher quand les événements sont générés

  const handleViewChange = (newView: typeof Views[keyof typeof Views]) => {
    setView(newView);
  };

  const handleNavigate = (newDate: Date, view?: string) => {
    setDate(newDate);
    if (view) {
      setView(view as typeof Views[keyof typeof Views]);
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    console.log('Créneau sélectionné:', slotInfo);
  };

  const addCoachToEvent = async (coachId: string) => {
    if (!selectedEvent || !coaches) return;

    const coach = coaches.find(c => c._id === coachId);
    if (!coach) return;

    const coachName = `${coach.prenom} ${coach.nom}`;
    
    // Vérifier si le coach n'est pas déjà assigné
    if (selectedEvent.resource?.coaches.includes(coachName)) {
      return;
    }
    
    // Sauvegarder en base de données
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://add-management2.onrender.com';
      const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const response = await fetch(`${cleanApiUrl}/planning/assign-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          coachName: coachName
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de l\'assignation');
      return;
    }
    
    // Mettre à jour l'état local seulement après la sauvegarde réussie
    setEvents(prev => prev.map(event => 
      event.id === selectedEvent.id 
        ? {
            ...event,
            resource: {
              ...event.resource!,
              coaches: [...event.resource!.coaches, coachName]
            }
          }
        : event
    ));

    setSelectedEvent(prev => prev ? {
      ...prev,
      resource: {
        ...prev.resource!,
        coaches: [...prev.resource!.coaches, coachName]
      }
    } : null);
  };

  const removeCoachFromEvent = async (coachName: string) => {
    if (!selectedEvent) return;

    // Sauvegarder en base de données
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://add-management2.onrender.com';
      const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const response = await fetch(`${cleanApiUrl}/planning/remove-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          coachName: coachName
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'assignation');
      return;
    }

    // Mettre à jour l'état local seulement après la sauvegarde réussie
    setEvents(prev => prev.map(event => 
      event.id === selectedEvent.id 
        ? {
            ...event,
            resource: {
              ...event.resource!,
              coaches: event.resource!.coaches.filter(c => c !== coachName)
            }
          }
        : event
    ));

    setSelectedEvent(prev => prev ? {
      ...prev,
      resource: {
        ...prev.resource!,
        coaches: prev.resource!.coaches.filter(c => c !== coachName)
      }
    } : null);
  };

  const addCustomCoach = () => {
    if (!newCoachName.trim() || !selectedEvent) return;

    setEvents(prev => prev.map(event => 
      event.id === selectedEvent.id 
        ? {
            ...event,
            resource: {
              ...event.resource!,
              coaches: [...event.resource!.coaches, newCoachName.trim()]
            }
          }
        : event
    ));

    setSelectedEvent(prev => prev ? {
      ...prev,
      resource: {
        ...prev.resource!,
        coaches: [...prev.resource!.coaches, newCoachName.trim()]
      }
    } : null);

    setNewCoachName('');
  };

  // Fonction pour obtenir les initiales d'un coach
  const getInitials = (coachName: string) => {
    const parts = coachName.split(' ');
    return parts.map(part => part.charAt(0).toUpperCase()).join('');
  };

  // Fonction pour obtenir la couleur d'un coach
  const getCoachColor = (coachName: string) => {
    if (!coaches) return '#6b7280';
    const coach = coaches.find(c => `${c.prenom} ${c.nom}` === coachName);
    return coach ? coachColors[coach._id] || '#6b7280' : '#6b7280';
  };

  // Filtrer les événements du samedi
  const saturdayEvents = events.filter(event => event.start.getDay() === 6);

  if (coachesLoading) {
    return (
      <div className="container mx-auto p-4 lg:max-w-7xl">
        <div className="flex items-center justify-center py-8">
          <div className="text-lg"> Chargement des coaches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {showMyPlanning ? 'Mon Planning' : 'Planning des cours'}
          </h1>
          <p className="text-gray-600">
            {showMyPlanning 
              ? `Cours où vous êtes assigné (${getMyEvents().length} cours)`
              : 'Gérez le planning des cours et événements'
            }
          </p>
        </div>
        <div className="flex gap-2">
          {/* Bouton pour basculer entre vue complète et vue personnelle */}
          {isCoach && (
            <Button
              variant={showMyPlanning ? "default" : "outline"}
              onClick={() => setShowMyPlanning(!showMyPlanning)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {showMyPlanning ? 'Voir tout le planning' : 'Mon planning'}
            </Button>
          )}
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 w-full md:w-auto">
              <Home className="h-4 w-4" />
              Retour au Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Message informatif pour les coaches */}
      {isCoach && showMyPlanning && getMyEvents().length === 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Aucun cours assigné</h3>
              <p className="text-sm text-blue-700">
                Vous n&apos;êtes pas encore assigné à des cours. Contactez un administrateur pour être ajouté aux cours.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {showMyPlanning ? 'Mon Calendrier' : 'Calendrier'}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="h-[800px]">
            <style jsx>{`
              .rbc-show-more {
                font-size: 10px !important;
                padding: 2px 4px !important;
                margin: 1px 0 !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                max-width: 100% !important;
                display: inline-block !important;
              }
              
              @media (max-width: 768px) {
                .rbc-show-more {
                  font-size: 8px !important;
                  padding: 1px 2px !important;
                  max-width: 90% !important;
                }
              }
            `}</style>
            <Calendar
              localizer={localizer}
              events={displayEvents} // Utiliser les événements filtrés
              startAccessor="start"
              endAccessor="end"
              view={view}
              date={date}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              style={{ height: '100%' }}
              culture="fr"
              formats={{
                dayFormat: 'dddd',
                dayHeaderFormat: 'dddd',
                dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                  (localizer?.format(start, 'dddd', culture) ?? '') + ' - ' + (localizer?.format(end, 'dddd', culture) ?? ''),
                monthHeaderFormat: 'MMMM YYYY',
                weekdayFormat: 'dddd',
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                  (localizer?.format(start, 'HH:mm', culture) ?? '') + ' - ' + (localizer?.format(end, 'HH:mm', culture) ?? ''),
              }}
              messages={{
                next: 'Suivant',
                previous: 'Précédent',
                today: "Aujourd'hui",
                month: 'Mois',
                week: 'Semaine',
                day: 'Jour',
                agenda: 'Agenda',
                date: 'Date',
                time: 'Heure',
                event: 'Événement',
                noEventsInRange: 'Aucun événement dans cette plage.',
                showMore: (total: number) => `+${total} de plus`,
              }}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.resource?.color || '#3b82f6',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '4px',
                  fontSize: '9px',
                  padding: '1px 2px',
                  marginBottom: '0.5px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  height: 'auto',
                  minHeight: '14px',
                },
              })}
              components={{
                event: ({ event }) => (
                  <div className="flex flex-col">
                    <div className="text-xs font-medium truncate">
                      {event.title}
                    </div>
                    {event.resource?.coaches && event.resource.coaches.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.resource.coaches.map((coach, index) => (
                          <div key={index} className="flex items-center">
                            {/* Version desktop avec initiales */}
                            <span
                              className="hidden md:inline text-xs px-1 py-0.5 rounded text-white"
                              style={{ backgroundColor: getCoachColor(coach) }}
                            >
                              {getInitials(coach)}
                            </span>
                            {/* Version mobile avec cercles */}
                            <div
                              className="md:hidden w-2 h-2 rounded-full border border-white"
                              style={{ backgroundColor: getCoachColor(coach) }}
                              title={coach}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              }}
              showMultiDayTimes={true}
              step={15}
              timeslots={2}
              popup={true}
              popupOffset={20}
              dayPropGetter={(date) => ({
                style: {
                  backgroundColor: date.toDateString() === new Date().toDateString() 
                    ? '#e0f2fe'
                    : 'transparent',
                  border: date.toDateString() === new Date().toDateString() 
                    ? '2px solid #0ea5e9'
                    : 'none',
                  borderRadius: '4px',
                },
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vue spéciale pour les samedis - seulement si pas en mode "Mon planning" */}
      {showSaturdayView && !showMyPlanning && (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cours du Samedi</CardTitle>
              <Button onClick={() => setShowSaturdayView(false)} variant="outline">
                Fermer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {saturdayEvents.map(event => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-600">
                    {moment(event.start).format('DD MMMM YYYY [à] HH:mm')}
                  </div>
                  {event.resource?.coaches && event.resource.coaches.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.resource.coaches.map((coach, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 rounded text-white"
                          style={{ backgroundColor: getCoachColor(coach) }}
                        >
                          {coach}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de gestion des coaches */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md mx-auto h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isCoach ? 'Coaches du cours' : 'Gestion des coaches'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
              {/* Informations du cours */}
              <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 text-sm">{selectedEvent.title}</h3>
                <p className="text-xs text-gray-600">
                  {moment(selectedEvent.start).format('dddd DD MMMM YYYY [à] HH:mm')}
                </p>
              </div>

              {/* Coaches assignés */}
              <div className="flex-1 flex flex-col min-h-0">
                <h4 className="font-medium mb-1 text-sm flex-shrink-0">Coaches assignés</h4>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {selectedEvent.resource?.coaches.length === 0 ? (
                    <p className="text-gray-500 text-xs">Pas de coaches assignés pour le moment</p>
                  ) : (
                    selectedEvent.resource?.coaches.map((coach, index) => (
                      <div key={index} className="flex items-center justify-between p-1.5 rounded" style={{ backgroundColor: `${getCoachColor(coach)}20` }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: getCoachColor(coach) }}
                          />
                          <span className="text-xs">{coach}</span>
                          {/* Indicateur pour le coach connecté */}
                          {isCoach && userProfile && `${userProfile.prenom} ${userProfile.nom}` === coach && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Vous</span>
                          )}
                        </div>
                        {/* Bouton de suppression seulement pour les admins */}
                        {!isCoach && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCoachFromEvent(coach)}
                            className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section d'ajout de coaches - Seulement pour les admins */}
              {!isCoach && (
                <>
                  {/* Ajouter un coach existant */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h4 className="font-medium mb-1 text-sm flex-shrink-0">Ajouter un coach</h4>
                    <div className="flex-1 overflow-y-auto grid grid-cols-1 gap-1">
                      {coaches?.sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })).map(coach => (
                        <Button
                          key={coach._id}
                          variant="outline"
                          size="sm"
                          onClick={() => addCoachToEvent(coach._id)}
                          disabled={selectedEvent.resource?.coaches.includes(`${coach.prenom} ${coach.nom}`)}
                          className="flex items-center justify-between h-8 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: coachColors[coach._id] || '#6b7280' }}
                            />
                            <span className="truncate">{coach.prenom} {coach.nom}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Ajouter un coach personnalisé */}
                  <div className="flex-shrink-0">
                    <h4 className="font-medium mb-1 text-sm">Coach personnalisé</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nom du coach"
                        value={newCoachName}
                        onChange={(e) => setNewCoachName(e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={addCustomCoach}
                        disabled={!newCoachName.trim()}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Bouton de fermeture */}
              <div className="flex-shrink-0 flex justify-end pt-2 border-t">
                <div className="flex gap-2">
                  {/* Bouton pour accéder à la feuille d'appel */}
                  <Link 
                    href={`/dashboard/attendance?course=${selectedEvent.id}`}
                    className="flex-1"
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-full flex items-center gap-2"
                    >
                      <ClipboardList className="h-3 w-3" />
                      Feuille d&apos;appel
                    </Button>
                  </Link>
                  <Button onClick={() => setIsDialogOpen(false)} size="sm" className="h-8">
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}