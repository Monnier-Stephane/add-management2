/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React,{ useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Plus, X, Users, Home, ClipboardList, Loader2 } from 'lucide-react';
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

// Interface pour les coaches
interface Coach {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: 'coach' | 'admin';
}


// Couleurs pour les coaches - Palette personnalisée
const COACH_COLORS = [
  "#FF0000", // Rouge pur
  "#00FF00", // Vert pur  
  "#0000FF", // Bleu pur
  "#FFFF00", // Jaune pur
  "#FF00FF", // Magenta pur
  "#00FFFF", // Cyan pur
  "#FF8000", // Orange vif
  "#8000FF", // Violet vif
  "#000000", // Noir
  "#FFFFFF", // Blanc (avec bordure)
  "#FF0080", // Rose vif
  "#80FF00", // Vert lime
  "#0080FF", // Bleu ciel
  "#FF8000", // Orange vif
  "#800080", // Violet foncé
  "#808000", // Olive
  "#008080", // Teal
  "#FF4040", // Rouge clair
  "#40FF40", // Vert clair
  "#4040FF", // Bleu clair
  "#FFFF40", // Jaune clair
  "#FF40FF", // Magenta clair
  "#40FFFF", // Cyan clair
  "#FF8040"  // Orange clair
];


const CACHE_KEY = 'planning-assignments-cache';



const setCachedAssignments = (data: any) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Erreur sauvegarde cache:', error);
  }
};

export default function PlanningPage() {
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCoachName, setNewCoachName] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [coachColors, setCoachColors] = useState<Record<string, string>>({});
  const [showSaturdayView, setShowSaturdayView] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showMyPlanning, setShowMyPlanning] = useState(false); 
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null); // Coach sélectionné pour filtrage

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

  // Fonction pour filtrer les événements par coach
  const getCoachEvents = (coachName: string) => {
    return events.filter(event => 
      event.resource?.coaches.includes(coachName)
    );
  };

  // Événements à afficher selon le mode
  const displayEvents = showMyPlanning ? getMyEvents() : 
    selectedCoach ? getCoachEvents(selectedCoach) : events;

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


  
  // Nouvelle fonction pour attribuer des couleurs stables ET uniques
  const assignStableUniqueColors = (coaches: Coach[]): Record<string, string> => {
    const colors: Record<string, string> = {};
    const usedColors = new Set<string>();
    
    // Trier les coaches par ID pour garantir un ordre stable
    const sortedCoaches = [...coaches].sort((a, b) => a._id.localeCompare(b._id));
    
    sortedCoaches.forEach((coach) => {
      // Utiliser un hash basé sur l'ID pour la stabilité
      let hash = 0;
      for (let i = 0; i < coach._id.length; i++) {
        const char = coach._id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      let colorIndex = Math.abs(hash) % COACH_COLORS.length;
      let color = COACH_COLORS[colorIndex];
      
      // Si collision, trouver la prochaine couleur disponible
      let attempts = 0;
      while (usedColors.has(color) && attempts < COACH_COLORS.length) {
        colorIndex = (colorIndex + 1) % COACH_COLORS.length;
        color = COACH_COLORS[colorIndex];
        attempts++;
      }
      
      usedColors.add(color);
      colors[coach._id] = color;
    });
    
    return colors;
  }; 

  useEffect(() => {
    ;
  
    // Charger seulement si on a les coaches
    if (coaches && coaches.length > 0) {
      const loadPlanningData = async (generateRecurringEvents: () => Event[]) => {
        // 1. Générer les événements
        const generatedEvents = generateRecurringEvents();
        setEvents(generatedEvents);
        
        // 2. Assigner les couleurs aux coaches de manière stable ET unique
        if (coaches) {
          const colors = assignStableUniqueColors(coaches);
          setCoachColors(colors);
        }
        
        // 3. Charger les assignations depuis l'API
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          let cleanApiUrl: string;
          
          if (!apiUrl) {
            console.warn('NEXT_PUBLIC_API_URL environment variable is not defined, using default');
            cleanApiUrl = 'http://localhost:3001';
          } else {
            cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
            
            // Validation de l'URL avant l'appel
            try {
              new URL(cleanApiUrl);
            } catch (urlError) {
              console.error('URL invalide:', cleanApiUrl, urlError);
              throw new Error('URL invalide dans NEXT_PUBLIC_API_URL');
            }
          }
          
          const response = await fetch(`${cleanApiUrl}/planning/assignments`);
          
          if (response.ok) {
            const assignments = await response.json();
            
            if (Array.isArray(assignments)) {
              setCachedAssignments(assignments);
              
              setEvents(prev => prev.map(event => {
                const assignment = assignments.find((a: any) => a.eventId === event.id);
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
      loadPlanningData(generateRecurringEvents);
    }
  }, [coaches]);

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

  const handleSelectSlot = () => {
    // Fonction pour gérer la sélection de créneaux
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
      }
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
    clearCacheAndReload(coaches);
  };

  const removeCoachFromEvent = async (coachName: string) => {
    if (!selectedEvent) return;

    // Sauvegarder en base de données
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
      }
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
    if (coaches) {
      clearCacheAndReload(coaches);
    }
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
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-lg">Chargement des coaches...</div>
          </div>
        </div>
      </div>
    );
  }

  const DateCellWrapper = ({ children }: { children: React.ReactElement }) =>
    React.cloneElement(React.Children.only(children), {
      style: {
        ...(children.props as any).style,
        borderRight: '1px solid #e5e7eb',
      },
    } as any);

  const clearCacheAndReload = (coaches: Coach[]) => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
      // Recharger les données
      if (coaches && coaches.length > 0) {
        const loadPlanningData = async (generateRecurringEvents: () => Event[]) => {
          // 1. Générer les événements
          const generatedEvents = generateRecurringEvents();
          setEvents(generatedEvents);
          
          // 2. Assigner les couleurs aux coaches de manière stable ET unique
          if (coaches) {
            const colors = assignStableUniqueColors(coaches);
            setCoachColors(colors);
          }
          
          // 3. Charger les assignations depuis l'API
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!apiUrl) {
              throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
            }
            const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
            const response = await fetch(`${cleanApiUrl}/planning/assignments`);
            
            if (response.ok) {
              const assignments = await response.json();
              
              if (Array.isArray(assignments)) {
                setCachedAssignments(assignments);
                
                setEvents(prev => prev.map(event => {
                  const assignment = assignments.find((a: any) => a.eventId === event.id);
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
        loadPlanningData(generateRecurringEvents);
      }
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
    }
  };


  return (
    <div className="w-full px-1 md:px-6 lg:px-8 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {showMyPlanning ? 'Mon Planning' : 
             selectedCoach ? `Planning de ${selectedCoach}` : 
             'Planning des cours'}
          </h1>
          <p className="text-gray-600">
            {showMyPlanning 
              ? `Cours où vous êtes assigné (${getMyEvents().length} cours)`
              : selectedCoach
                ? `Cours où ${selectedCoach} est assigné (${getCoachEvents(selectedCoach).length} cours)`
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

      
{/* Menu déroulant mobile personnalisé - au-dessus du planning */}
<div className="lg:hidden mb-4">
  <Card className="p-3 mx-1">
    <h3 className="font-semibold mb-3 text-sm">Filtrer par coach</h3>
    <div className="space-y-2">
      {/* Bouton pour afficher tous les cours */}
      <button
        onClick={() => setSelectedCoach(null)}
        className={`flex items-center gap-2 p-3 border rounded-lg w-full text-left transition-colors ${
          selectedCoach === null 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <span className="text-xs px-2 py-1 rounded text-white bg-gray-600">
          Tous
        </span>
        <span className="text-sm font-medium">Tous les cours</span>
      </button>
      
      {/* Menu déroulant personnalisé pour les coaches */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full p-3 border border-gray-200 rounded-lg bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer flex items-center justify-between"
        >
          <span className="text-gray-700">
            {selectedCoach ? selectedCoach : "Sélectionner un coach"}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Liste déroulante personnalisée - conditionnellement affichée */}
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {coaches?.sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })).map(coach => {
              const coachName = `${coach.prenom} ${coach.nom}`;
              const isSelected = selectedCoach === coachName;
              return (
                <button
                  key={coach._id}
                  onClick={() => {
                    setSelectedCoach(isSelected ? null : coachName);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''}`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: coachColors[coach._id] }}
                  />
                  <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
  {coach.prenom.toLowerCase()} {coach.nom.toUpperCase()}
</div>
                    <div className="text-xs text-gray-500">
                      {getInitials(coachName)}
                    </div>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </Card>
</div>

      <div className="flex gap-4">
        {/* Légende des coaches - Desktop uniquement */}
        <div className="hidden lg:block w-1/10">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Coaches</h3>
            <div className="space-y-2">
              {coaches?.sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })).map(coach => {
                const coachName = `${coach.prenom} ${coach.nom}`;
                const isSelected = selectedCoach === coachName;
                return (
                  <button
                    key={coach._id}
                    onClick={() => setSelectedCoach(isSelected ? null : coachName)}
                    className={`flex items-center gap-2 p-2 border rounded-lg w-full text-left transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      className="text-xs px-1 py-0.5 rounded text-white"
                      style={{ backgroundColor: coachColors[coach._id] }}
                    >
                      {getInitials(coachName)}
                    </span>
                    <span className="text-sm font-medium">
                      {coach.prenom} {coach.nom}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
        
        {/* Planning */}
        <div className="flex-1 lg:w-9/10">
          <Card className="mx-0 md:mx-4 lg:mx-0 p-1 md:p-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {showMyPlanning ? 'Mon Calendrier' : 'Calendrier'}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-2 md:p-6">
          <div className="h-[1400px]">
          <style jsx>{`
  .rbc-month-view .rbc-date-cell {
  min-height: 350px !important;
}

/* Hauteur encore plus grande sur mobile */
@media (max-width: 768px) {
  .rbc-month-view .rbc-date-cell {
    min-height: 400px !important;
  }
  
  /* Réduire le padding sur mobile */
  .rbc-calendar {
    padding: 4px !important;
  }
  
  .rbc-toolbar {
    padding: 8px 4px !important;
    margin-bottom: 8px !important;
  }
  
  .rbc-header {
    padding: 4px 2px !important;
  }
  
  .rbc-date-cell {
    padding: 2px !important;
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
                dateCellWrapper: DateCellWrapper,
                event: ({ event }) => (
                  <div className="text-xs">
                    <div className="font-medium">{event.title}</div>
                    {event.resource?.coaches && event.resource.coaches.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {/* Version desktop - tous les coaches avec retour à la ligne */}
                        <div className="hidden md:flex flex-wrap gap-1">
                          {event.resource.coaches.map((coach, index) => (
                            <span
                              key={index}
                              className="text-xs px-1 py-0.5 rounded text-white border border-gray-300"
                              style={{ backgroundColor: getCoachColor(coach) }}
                            >
                              {getInitials(coach)}
                            </span>
                          ))}
                        </div>
                        
                        {/* Version mobile - tous les cercles avec retour à la ligne */}
                        <div className="md:hidden flex flex-wrap gap-1">
                          {event.resource.coaches.map((coach, index) => (
                            <div
                              key={index}
                              className="w-3 h-3 rounded-full border border-white"
                              style={{ backgroundColor: getCoachColor(coach) }}
                              title={coach}
                            />
                          ))}
                        </div>
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
        </div>
      </div>

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