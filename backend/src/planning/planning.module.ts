/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import {
  PlanningAssignment,
  PlanningAssignmentSchema,
} from './schemas/planning-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanningAssignment.name, schema: PlanningAssignmentSchema },
    ]),
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
