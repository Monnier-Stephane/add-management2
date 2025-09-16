import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { Coach, CoachDocument } from './schemas/coach.schema';

@Injectable()
export class CoachesService {
  constructor(
    @InjectModel(Coach.name) private coachModel: Model<CoachDocument>,
  ) {}

  async create(createCoachDto: CreateCoachDto): Promise<Coach> {
    const newCoach = new this.coachModel(createCoachDto);
    return newCoach.save();
  }

  async findAll(): Promise<Coach[]> {
    return this.coachModel.find().exec();
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
    return updatedCoach;
  }

  async remove(id: string): Promise<Coach> {
    const deletedCoach = await this.coachModel.findByIdAndDelete(id).exec();
    if (!deletedCoach) {
      throw new NotFoundException(`Coach avec l'ID "${id}" non trouvé`);
    }
    return deletedCoach;
  }

  async findByEmail(email: string): Promise<Coach | null> {
    return this.coachModel.findOne({ email }).exec();
  }
}
