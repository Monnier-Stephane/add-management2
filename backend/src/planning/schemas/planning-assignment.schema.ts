/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class PlanningAssignment extends Document {
  @Prop({ required: true })
  eventId: string;

  @Prop({ type: [String], default: [] })
  coaches: string[];
}

export const PLANNING_ASSIGNMENT_MODEL = 'PlanningAssignment';

export const PlanningAssignmentSchema =
  SchemaFactory.createForClass(PlanningAssignment);
