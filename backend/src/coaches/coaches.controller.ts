import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CoachesService } from './coaches.service';

import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Controller('coaches')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Post()
  create(@Body() createCoachDto: CreateCoachDto) {
    return this.coachesService.create(createCoachDto);
  }

  @Get()
  findAll() {
    return this.coachesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coachesService.findOne(id);
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string) {
    console.log('🔍 Recherche du coach par email:', email);
    const coach = await this.coachesService.findByEmail(email);
    console.log('📤 Coach retourné:', {
      email: coach?.email,
      prenom: coach?.prenom,
      nom: coach?.nom,
      statut: coach?.statut,
      isNull: coach === null,
      fullObject: coach,
    });
    return coach;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCoachDto: UpdateCoachDto) {
    return this.coachesService.update(id, updateCoachDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coachesService.remove(id);
  }
}
