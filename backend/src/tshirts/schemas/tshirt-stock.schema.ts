import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TshirtStockDocument = TshirtStock & Document;

@Schema()
export class TshirtStock {
  @Prop({ required: true, unique: true })
  taille!: string;

  @Prop({ required: true, default: 0 })
  quantiteRecue!: number;
}

export const TshirtStockSchema = SchemaFactory.createForClass(TshirtStock);