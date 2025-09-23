/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Body } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { PlanningAssignment } from './schemas/planning-assignment.schema';

@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post('assign-coach')
  async assignCoach(@Body() data: { eventId: string; coachName: string }): Promise<PlanningAssignment> {
    return this.planningService.assignCoach(data.eventId, data.coachName);
  }

  @Post('remove-coach')
  async removeCoach(@Body() data: { eventId: string; coachName: string }): Promise<PlanningAssignment | null> {
    return this.planningService.removeCoach(data.eventId, data.coachName);
  }

  @Get('assignments')
  async getAssignments(): Promise<PlanningAssignment[]> {
    return this.planningService.getAssignments();
  }
}
