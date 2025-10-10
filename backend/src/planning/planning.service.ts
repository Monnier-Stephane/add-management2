/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlanningAssignment } from './schemas/planning-assignment.schema';
import { Coach } from '../coaches/schemas/coach.schema';

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel('PlanningAssignment')
    private planningModel: Model<PlanningAssignment>,
    @InjectModel('Coach')
    private coachModel: Model<Coach>,
  ) {}
  async assignCoach(eventId: string, coachName: string): Promise<PlanningAssignment> {
    const assignment = await this.planningModel.findOne({ eventId }).exec();

    if (assignment && assignment.coaches) {
      assignment.coaches.push(coachName);
      return assignment.save();
    } else {
      const newAssignment = new this.planningModel({
        eventId,
        coaches: [coachName],
      });
      return newAssignment.save();
    }
  }

  async removeCoach(eventId: string, coachName: string): Promise<PlanningAssignment | null> {
    const assignment = await this.planningModel.findOne({ eventId });
    if (assignment && assignment.coaches) {
      assignment.coaches = assignment.coaches.filter((c) => c !== coachName);
      return assignment.save();
    }
    return null;
  }

  async getAssignments(): Promise<PlanningAssignment[]> {
    return this.planningModel.find();
  }

  async getTodayCourses(coachEmail?: string) {
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    try {
      // Récupérer tous les assignments du planning
      const assignments = await this.planningModel.find().exec();
      
      if (assignments.length === 0) {
        console.log('❌ Aucun événement trouvé dans le planning');
        return [];
      }

      console.log(`📅 ${assignments.length} événements trouvés dans le planning`);

      // Récupérer le coach si un email est fourni
      let coach = null;
      if (coachEmail) {
        coach = await this.coachModel.findOne({ email: coachEmail, statut: 'coach' }).exec();
        if (!coach) {
          console.log(`❌ Coach non trouvé pour l'email: ${coachEmail}`);
          return [];
        }
        console.log(`👨‍🏫 Coach trouvé: ${coach.prenom} ${coach.nom}`);
      }

      // Filtrer les événements d'aujourd'hui et par coach si spécifié
      const todayEvents = assignments.filter(assignment => {
        // Vérifier si l'eventId contient la date d'aujourd'hui
        const eventDate = new Date(parseInt(assignment.eventId.split('-').pop() || '0'));
        const isToday = eventDate.toISOString().split('T')[0] === today;
        
        // Si un coach est spécifié, vérifier qu'il est assigné à cet événement
        if (coach && isToday) {
          const coachFullName = `${coach.prenom} ${coach.nom}`;
          return assignment.coaches.includes(coachFullName);
        }
        
        return isToday;
      });

      console.log(`📅 ${todayEvents.length} événements trouvés pour aujourd'hui${coachEmail ? ` pour ${coachEmail}` : ''}`);

      // Convertir les événements en cours
      const courses = todayEvents.map(assignment => {
        // Parser l'eventId pour extraire les informations
        const eventParts = assignment.eventId.split(' - ');
        const dayTime = eventParts[0]; // "Mercredi 12h15"
        const location = eventParts[1]?.split('-')[0] || 'Lieu non spécifié'; // "Châtelet"
        
        // Extraire l'heure du jourTime
        const timeMatch = dayTime.match(/(\d{1,2}h\d{0,2})/);
        const time = timeMatch ? timeMatch[1] : 'Heure non spécifiée';
        
        // Compter le nombre de coaches assignés
        const students = assignment.coaches.length;
        
        return {
          id: assignment._id.toString(),
          name: dayTime,
          time: time,
          students: students,
          location: location,
          coachId: coach?._id.toString() || 'multiple',
          coachName: coach ? `${coach.prenom} ${coach.nom}` : 'Multiple coaches',
          coachEmail: coach?.email || 'multiple@example.com',
          date: today,
          assignedCoaches: assignment.coaches
        };
      });

      console.log(`📅 Cours du jour ${today} créés:`, courses.length);
      return courses;
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des coaches:', error);
      
      // Fallback avec des données mockées
      const fallbackCourses = [
        {
          id: 'fallback-1',
          name: 'Parkour Niveau 1',
          time: '16h00',
          students: 6,
          location: 'Salle A',
          coachId: 'fallback-1',
          coachName: 'Coach Fallback',
          coachEmail: 'coach@example.com',
          date: today
        }
      ];
      
      console.log('🔄 Utilisation des données de fallback');
      return fallbackCourses;
    }
  }
}
