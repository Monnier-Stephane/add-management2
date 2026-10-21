import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TshirtStock, TshirtStockDocument } from './schemas/tshirt-stock.schema';

@Injectable()
export class TshirtsService {
  constructor(
    @InjectModel(TshirtStock.name)
    private tshirtStockModel: Model<TshirtStockDocument>,
  ) {}

  findAll() {
    return this.tshirtStockModel.find().sort({ taille: 1 }).exec();
  }

  async setQuantite(taille: string, quantiteRecue: number) {
    const taillePropre = taille.trim();
    if (!taillePropre) {
      throw new BadRequestException('Taille manquante');
    }
    if (!Number.isInteger(quantiteRecue) || quantiteRecue < 0) {
      throw new BadRequestException('La quantité doit être un entier positif ou nul');
    }

    return this.tshirtStockModel
      .findOneAndUpdate(
        { taille: taillePropre },
        { taille: taillePropre, quantiteRecue },
        { upsert: true, new: true },
      )
      .exec();
  }
}