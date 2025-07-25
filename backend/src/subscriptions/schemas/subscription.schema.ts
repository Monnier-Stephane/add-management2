import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema()
export class Subscription {
  @Prop()
  nom: string;

  @Prop()
  prenom: string;

  @Prop()
  email: string;

  @Prop()
  telephone: string;

  @Prop()
  dateDeNaissance: Date;

  @Prop()
  adresse: string;

  @Prop()
  ville: string;

  @Prop()
  codePostal: string;

  @Prop()
  tarif: string;

  @Prop({ default: Date.now })
  dateInscription: Date;

  @Prop({ 
    type: String, 
    enum: ['payé', 'en attente', 'annulé'], 
    default: 'en attente' 
  })
  statutPaiement: string;

  @Prop()
  remarques: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription); 