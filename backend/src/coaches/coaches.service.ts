/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { Coach, CoachDocument } from './schemas/coach.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CoachesService {
  constructor(
    @InjectModel(Coach.name) private readonly coachModel: Model<CoachDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createCoachDto: CreateCoachDto): Promise<Coach> {
    const newCoach = new this.coachModel(createCoachDto);
    const result = await newCoach.save();

    // Invalider le cache
    await this.cacheManager.del('coaches:all');
    // Invalider aussi le cache par email si l'email existe
    if (result.email) {
      await this.cacheManager.del(`coaches:email:${result.email}`);
    }

    return result;
  }

  async findAll(): Promise<Coach[]> {
    const cacheKey = 'coaches:all';

    // Vérifier le cache
    const cached = await this.cacheManager.get<Coach[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Si pas en cache, récupérer depuis MongoDB
    const data = await this.coachModel.find().exec();

    // Mettre en cache pour 5 minutes
    await this.cacheManager.set(cacheKey, data, 300);

    return data;
  }

  async findOne(id: string): Promise<Coach> {
    const coach = await this.coachModel.findById(id).exec();
    if (!coach) {
      throw new NotFoundException(`Coach avec l'ID "${id}" non trouvé`);
    }
    return coach;
  }

  async update(id: string, updateCoachDto: UpdateCoachDto): Promise<Coach> {
    const updatedCoach = await this.coachModel
      .findByIdAndUpdate(id, updateCoachDto, { new: true })
      .exec();
    if (!updatedCoach) {
      throw new NotFoundException(`Coach avec l'ID "${id}" non trouvé`);
    }

    // Invalider le cache
    await this.cacheManager.del('coaches:all');
    // Invalider aussi le cache par email si l'email existe
    if (updatedCoach.email) {
      await this.cacheManager.del(`coaches:email:${updatedCoach.email}`);
    }

    return updatedCoach;
  }

  async remove(id: string): Promise<Coach> {
    const deletedCoach = await this.coachModel.findByIdAndDelete(id).exec();
    if (!deletedCoach) {
      throw new NotFoundException(`Coach avec l'ID "${id}" non trouvé`);
    }

    // Invalider le cache
    await this.cacheManager.del('coaches:all');
    // Invalider aussi le cache par email si l'email existe
    if (deletedCoach.email) {
      await this.cacheManager.del(`coaches:email:${deletedCoach.email}`);
    }

    return deletedCoach;
  }

  async findByEmail(email: string): Promise<Coach | null> {
    const cacheKey = `coaches:email:${email}`;

    // Vérifier le cache
    const cached = await this.cacheManager.get<Coach>(cacheKey);
    if (cached) {
      return cached;
    }

    // Si pas en cache, récupérer depuis MongoDB
    const coach = await this.coachModel.findOne({ email }).exec();

    // Mettre en cache pour 5 minutes (même durée que les autres)
    await this.cacheManager.set(cacheKey, coach, 300);

    return coach;
  }
}
