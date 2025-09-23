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

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel('PlanningAssignment')
    private planningModel: Model<PlanningAssignment>,
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
}
