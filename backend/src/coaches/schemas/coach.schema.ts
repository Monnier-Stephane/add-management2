import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CoachDocument = Coach & Document;

@Schema()
export class Coach {
  @Prop()
  nom: string;

  @Prop()
  prenom: string;

  @Prop()
  email: string;

  @Prop({ type: String, enum: ['coach', 'admin'], default: 'coach' })
  statut: 'coach' | 'admin';
}

export const CoachSchema = SchemaFactory.createForClass(Coach);
