import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const newSubscription = new this.subscriptionModel(createSubscriptionDto);
    const result = await newSubscription.save();

    // Invalider le cache
    await this.cacheManager.del('subscriptions:all');
    await this.cacheManager.del('subscriptions:stats');

    return result;
  }

  async findAll(): Promise<Subscription[]> {
    const cacheKey = 'subscriptions:all';

    // Vérifier le cache
    const cached = await this.cacheManager.get<Subscription[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Récupérer depuis MongoDB
    const data = await this.subscriptionModel.find().exec();

    // Mettre en cache (5 minutes)
    await this.cacheManager.set(cacheKey, data, 300);

    return data;
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }
    return subscription;
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const updatedSubscription = await this.subscriptionModel
      .findByIdAndUpdate(id, updateSubscriptionDto, { new: true })
      .exec();
    if (!updatedSubscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }

    // Invalider le cache
    await this.cacheManager.del('subscriptions:all');
    await this.cacheManager.del('subscriptions:stats');

    return updatedSubscription;
  }

  async remove(id: string): Promise<Subscription> {
    const deletedSubscription = await this.subscriptionModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedSubscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }

    // Invalider le cache
    await this.cacheManager.del('subscriptions:all');
    await this.cacheManager.del('subscriptions:stats');

    return deletedSubscription;
  }

  async getUniqueTarifs(): Promise<string[]> {
    const tarifs = await this.subscriptionModel.distinct('tarif').exec();
    return tarifs.filter((tarif) => tarif && tarif.trim() !== '');
  }

  async getStats() {
    const cacheKey = 'subscriptions:stats';

    // Vérifier le cache
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Récupérer depuis MongoDB
    const subscriptions = await this.subscriptionModel.find().exec();

    const total = subscriptions.length;
    let attente = 0,
      paye = 0,
      enfants = 0,
      ados = 0,
      adultes = 0;

    subscriptions.forEach((item: any) => {
      // Payment status
      if (item.statutPaiement === 'en attente') attente++;
      if (item.statutPaiement === 'payé') paye++;

      // Categorization by pricing tier
      const tarif = (item.tarif || '').toLowerCase();
      if (tarif.includes('enfant')) enfants++;
      else if (tarif.includes('ado')) ados++;
      else if (tarif.includes('adulte')) adultes++;
    });

    const stats = {
      total,
      attente,
      paye,
      enfants,
      ados,
      adultes,
    };

    // Mettre en cache (5 minutes)
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }
}
