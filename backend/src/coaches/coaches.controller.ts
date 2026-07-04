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
import { Roles } from '../auth/roles.decorator';

import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Controller('coaches')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Post()
  @Roles('admin')
  create(@Body() createCoachDto: CreateCoachDto) {
    return this.coachesService.create(createCoachDto);
  }

  @Get()
  findAll() {
    return this.coachesService.findAll();
  }

  @Get('by-email/:email')
  async findByEmail(@Param('email') email: string) {
    console.log('🔍 Recherche du coach par email:', email);
    const coach = await this.coachesService.findByEmail(email);
    console.log('Coach retourné:', {
      email: coach?.email,
      prenom: coach?.prenom,
      nom: coach?.nom,
      statut: coach?.statut,
      isNull: coach === null,
      fullObject: coach,
    });
    return coach;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coachesService.findOne(id);
  }


  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateCoachDto: UpdateCoachDto) {
    return this.coachesService.update(id, updateCoachDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.coachesService.remove(id);
  }
}
