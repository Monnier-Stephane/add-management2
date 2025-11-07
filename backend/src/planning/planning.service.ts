/* eslint-disable prettier/prettier */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlanningAssignment } from './schemas/planning-assignment.schema';
import { Coach } from '../coaches/schemas/coach.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel('PlanningAssignment')
    private planningModel: Model<PlanningAssignment>,
    @InjectModel('Coach')
    private coachModel: Model<Coach>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async assignCoach(
    eventId: string,
    coachName: string,
  ): Promise<PlanningAssignment> {
    const assignment = await this.planningModel.findOne({ eventId }).exec();

    if (assignment && assignment.coaches) {
      assignment.coaches.push(coachName);
      const result = await assignment.save();

      // Invalider le cache
      await this.cacheManager.del('planning:assignments');
      await this.cacheManager.del('planning:today-courses:all');

      return result;
    } else {
      const newAssignment = new this.planningModel({
        eventId,
        coaches: [coachName],
      });
      const result = await newAssignment.save();

      // Invalider le cache
      await this.cacheManager.del('planning:assignments');
      await this.cacheManager.del('planning:today-courses:all');

      return result;
    }
  }

  async removeCoach(
    eventId: string,
    coachName: string,
  ): Promise<PlanningAssignment | null> {
    const assignment = await this.planningModel.findOne({ eventId });
    if (assignment && assignment.coaches) {
      assignment.coaches = assignment.coaches.filter((c) => c !== coachName);
      const result = await assignment.save();

      // Invalider le cache
      await this.cacheManager.del('planning:assignments');
      await this.cacheManager.del('planning:today-courses:all');

      return result;
    }
    return null;
  }

  async getAssignments(): Promise<PlanningAssignment[]> {
    const cacheKey = 'planning:assignments';

    // Vérifier le cache
    const cached = await this.cacheManager.get<PlanningAssignment[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Si pas en cache, récupérer depuis MongoDB
    const data = await this.planningModel.find();

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, data, 300);

    return data;
  }

  async getTodayCourses(coachEmail?: string) {
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const cacheKey = `planning:today-courses:${coachEmail || 'all'}`;

    // Vérifier le cache
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Récupérer tous les assignments du planning
      const assignments = await this.planningModel.find().exec();

      if (assignments.length === 0) {
        return [];
      }

      // Récupérer le coach si un email est fourni
      let coach: Coach | null = null;
      if (coachEmail) {
        coach = await this.coachModel
          .findOne({ email: coachEmail, statut: 'coach' })
          .exec();
        if (!coach) {
          return [];
        }
      }

      // Filtrer les événements d'aujourd'hui et par coach si spécifié
      const todayEvents = assignments.filter((assignment) => {
        // Vérifier si l'eventId contient la date d'aujourd'hui
        const eventDate = new Date(
          parseInt(assignment.eventId.split('-').pop() || '0'),
        );
        const isToday = eventDate.toISOString().split('T')[0] === today;

        // Si un coach est spécifié, vérifier qu'il est assigné à cet événement
        if (coach && isToday) {
          const coachFullName = `${coach.prenom} ${coach.nom}`;
          return assignment.coaches.includes(coachFullName);
        }

        return isToday;
      });

      // Convertir les événements en cours
      const courses = todayEvents.map((assignment) => {
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
          id: (assignment._id as any).toString(),
          name: dayTime,
          time: time,
          students: students,
          location: location,
          coachId: (coach as any)?._id?.toString() || 'multiple',
          coachName: coach
            ? `${coach.prenom} ${coach.nom}`
            : 'Multiple coaches',
          coachEmail: coach?.email || 'multiple@example.com',
          date: today,
          assignedCoaches: assignment.coaches,
        };
      });

      await this.cacheManager.set(cacheKey, courses, 300);
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
          date: today,
        },
      ];

      return fallbackCourses;
    }
  }
}
