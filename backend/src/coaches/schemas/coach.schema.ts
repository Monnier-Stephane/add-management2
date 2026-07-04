import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CoachDocument = HydratedDocument<Coach>;

@Schema()
export class Coach {
  @Prop()
  nom: string;

  @Prop()
  prenom: string;

  @Prop()
  email: string;

  @Prop()
  telephone: string;

  @Prop({ type: String, enum: ['coach', 'admin'], default: 'coach' })
  statut: 'coach' | 'admin';
}

export const CoachSchema = SchemaFactory.createForClass(Coach);
