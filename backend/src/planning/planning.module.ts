/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import {
  PlanningAssignment,
  PlanningAssignmentSchema,
} from './schemas/planning-assignment.schema';
import { Coach, CoachSchema } from '../coaches/schemas/coach.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanningAssignment.name, schema: PlanningAssignmentSchema },
      { name: Coach.name, schema: CoachSchema },
    ]),
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
