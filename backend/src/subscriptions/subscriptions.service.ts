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
    // Normaliser tarif : convertir string en tableau si nécessaire
    const normalizedDto = {
      ...createSubscriptionDto,
      tarif: Array.isArray(createSubscriptionDto.tarif)
        ? createSubscriptionDto.tarif
        : createSubscriptionDto.tarif
          ? [createSubscriptionDto.tarif]
          : [],
    };

    const newSubscription = new this.subscriptionModel(normalizedDto);
    const result = await newSubscription.save();

    // Invalider le cache (ignorer les erreurs si Redis n'est pas disponible)
    try {
      await this.cacheManager.del('subscriptions:all');
      await this.cacheManager.del('subscriptions:stats');
      await this.cacheManager.del('subscriptions:tarifs:unique');
    } catch (cacheError) {
      console.warn('Cache invalidation failed (non-critical):', cacheError);
    }

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
    let updateData: any = {};
    try {
      // Normaliser tarif : convertir string en tableau si nécessaire
      if (updateSubscriptionDto.tarif !== undefined) {
        updateData.tarif = Array.isArray(updateSubscriptionDto.tarif)
          ? updateSubscriptionDto.tarif
          : updateSubscriptionDto.tarif
            ? [updateSubscriptionDto.tarif]
            : [];
      }
      
      // Normaliser dateDeNaissance : convertir string en Date si nécessaire
      if (updateSubscriptionDto.dateDeNaissance !== undefined) {
        const dateValue = updateSubscriptionDto.dateDeNaissance;
        if (dateValue instanceof Date) {
          updateData.dateDeNaissance = dateValue;
        } else if (typeof dateValue === 'string') {
          updateData.dateDeNaissance = new Date(dateValue);
        } else {
          updateData.dateDeNaissance = dateValue;
        }
      }
      
      // Copier tous les autres champs
      if (updateSubscriptionDto.nom !== undefined) updateData.nom = updateSubscriptionDto.nom;
      if (updateSubscriptionDto.prenom !== undefined) updateData.prenom = updateSubscriptionDto.prenom;
      if (updateSubscriptionDto.email !== undefined) updateData.email = updateSubscriptionDto.email;
      if (updateSubscriptionDto.telephone !== undefined) updateData.telephone = updateSubscriptionDto.telephone;
      if (updateSubscriptionDto.telephoneUrgence !== undefined) updateData.telephoneUrgence = updateSubscriptionDto.telephoneUrgence;
      if (updateSubscriptionDto.adresse !== undefined) updateData.adresse = updateSubscriptionDto.adresse;
      if (updateSubscriptionDto.ville !== undefined) updateData.ville = updateSubscriptionDto.ville;
      if (updateSubscriptionDto.codePostal !== undefined) updateData.codePostal = updateSubscriptionDto.codePostal;
      if (updateSubscriptionDto.statutPaiement !== undefined) updateData.statutPaiement = updateSubscriptionDto.statutPaiement;
      if (updateSubscriptionDto.remarques !== undefined) updateData.remarques = updateSubscriptionDto.remarques;

      // Vérifier qu'il y a des données à mettre à jour
      if (Object.keys(updateData).length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      // Mise à jour MongoDB - utiliser updateOne pour éviter les problèmes
      await this.subscriptionModel.updateOne({ _id: id }, updateData).exec();
      const updatedSubscription = await this.subscriptionModel.findById(id).exec();
        
      if (!updatedSubscription) {
        throw new NotFoundException(`Subscription with ID "${id}" not found`);
      }

      // Invalider le cache (ignorer les erreurs si Redis n'est pas disponible)
      try {
        await this.cacheManager.del('subscriptions:all');
        await this.cacheManager.del('subscriptions:stats');
        await this.cacheManager.del('subscriptions:tarifs:unique');
      } catch (cacheError) {
        console.warn('Cache invalidation failed (non-critical):', cacheError);
      }

      return updatedSubscription;
    } catch (error) {
      console.error('❌ Error updating subscription:', error);
      console.error('📥 Update DTO received:', JSON.stringify(updateSubscriptionDto, null, 2));
      console.error('🔄 Update data prepared:', JSON.stringify(updateData, null, 2));
      if (error instanceof Error) {
        console.error('📝 Error message:', error.message);
        console.error('📚 Error stack:', error.stack);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Subscription> {
    const deletedSubscription = await this.subscriptionModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedSubscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }

    // Invalider le cache (ignorer les erreurs si Redis n'est pas disponible)
    try {
      await this.cacheManager.del('subscriptions:all');
      await this.cacheManager.del('subscriptions:stats');
      await this.cacheManager.del('subscriptions:tarifs:unique');
    } catch (cacheError) {
      console.warn('Cache invalidation failed (non-critical):', cacheError);
    }

    return deletedSubscription;
  }

  async getUniqueTarifs(): Promise<string[]> {
    const cacheKey = 'subscriptions:tarifs:unique';

    // Vérifier le cache
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Récupérer toutes les subscriptions avec leurs tarifs (tableaux)
    const subscriptions = await this.subscriptionModel.find().select('tarif').exec();

    // Extraire tous les tarifs uniques depuis les tableaux
    const allTarifs = new Set<string>();
    subscriptions.forEach((sub: any) => {
      if (Array.isArray(sub.tarif)) {
        sub.tarif.forEach((tarif) => {
          if (tarif && typeof tarif === 'string' && tarif.trim() !== '') {
            allTarifs.add(tarif.trim());
          }
        });
      } else if (sub.tarif && typeof sub.tarif === 'string' && sub.tarif.trim() !== '') {
        // Rétrocompatibilité : si tarif est encore un string (anciennes données)
        allTarifs.add(sub.tarif.trim());
      }
    });

    const result = Array.from(allTarifs).sort();

    // Mettre en cache (5 minutes)
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
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
      // Gérer les tarifs comme tableau ou string (rétrocompatibilité)
      const tarifs = Array.isArray(item.tarif) ? item.tarif : [item.tarif].filter(Boolean);

      // Déterminer la catégorie principale de la souscription (une seule catégorie par souscription)
      let categoryFound = false;
      for (const tarif of tarifs) {
        if (!tarif) continue;
        const tarifLower = (tarif || '').toLowerCase();
        
        // Priorité : enfants > ados > adultes (première catégorie trouvée)
        if (!categoryFound && tarifLower.includes('enfant')) {
          enfants++;
          categoryFound = true;
          break; // Une souscription ne peut être que dans une catégorie
        } else if (!categoryFound && tarifLower.includes('ado')) {
          ados++;
          categoryFound = true;
          break;
        } else if (!categoryFound && tarifLower.includes('adulte')) {
          adultes++;
          categoryFound = true;
          break;
        }
      }
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
