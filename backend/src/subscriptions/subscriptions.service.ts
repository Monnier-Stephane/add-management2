import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    const newSubscription = new this.subscriptionModel(createSubscriptionDto);
    return newSubscription.save();
  }

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionModel.find().exec();
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }
    return subscription;
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
    const updatedSubscription = await this.subscriptionModel.findByIdAndUpdate(id, updateSubscriptionDto, { new: true }).exec();
    if (!updatedSubscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }
    return updatedSubscription;
  }

  async remove(id: string): Promise<Subscription> {
    const deletedSubscription = await this.subscriptionModel.findByIdAndDelete(id).exec();
    if (!deletedSubscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }
    return deletedSubscription;
  }

  async getUniqueTarifs(): Promise<string[]> {
    const tarifs = await this.subscriptionModel.distinct('tarif').exec();
    return tarifs.filter(tarif => tarif && tarif.trim() !== '');
  }
} 