/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PlanningService, TodayCourse } from './planning.service';
import { PlanningAssignment } from './schemas/planning-assignment.schema';
import { Roles } from '../auth/roles.decorator';

@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post('assign-coach')
  @Roles('admin')
  async assignCoach(@Body() data: { eventId: string; coachName: string }): Promise<PlanningAssignment> {
    return this.planningService.assignCoach(data.eventId, data.coachName);
  }

  @Post('remove-coach')
  @Roles('admin')
  async removeCoach(@Body() data: { eventId: string; coachName: string }): Promise<PlanningAssignment | null> {
    return this.planningService.removeCoach(data.eventId, data.coachName);
  }

  @Get('assignments')
  async getAssignments(): Promise<PlanningAssignment[]> {
    return this.planningService.getAssignments();
  }

  @Get('today-courses')
  async getTodayCourses(@Query('coachEmail') coachEmail?: string): Promise<TodayCourse[]> {
    return this.planningService.getTodayCourses(coachEmail);
  }
}
