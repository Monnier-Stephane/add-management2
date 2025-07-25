'use client';

import React from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Custom event type extending the base Event interface
interface CustomEvent extends Event {
  title: string;
  start: Date;
  end: Date;
  coachColor?: string;
}

const initialEvents: CustomEvent[] = [
  {
    title: 'CBD + TTH',
    start: new Date('2025-05-12T10:00:00'),
    end: new Date('2025-05-12T11:15:00'),
    coachColor: '#4ade80', // green
  },
  {
    title: 'SMO + AZN',
    start: new Date('2025-05-13T14:00:00'),
    end: new Date('2025-05-13T15:30:00'),
    coachColor: '#60a5fa', // blue
  },
];

export default function PlanningCalendar() {
  const [events] = useState<CustomEvent[]>(initialEvents);

  return (
    <div className="h-[85vh] md:p-12">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={['month', 'week']}
        style={{ height: '100%' }}
        messages={{
          today: "Aujourd'hui",
          next: 'Suivant',
          previous: 'Précédent',
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
        }}
        eventPropGetter={(event: CustomEvent) => ({
          style: {
            backgroundColor: event.coachColor || '#3b82f6',
            color: '#fff',
            borderRadius: '4px',
            padding: '4px',
          },
        })}
      />
    </div>
  );
}