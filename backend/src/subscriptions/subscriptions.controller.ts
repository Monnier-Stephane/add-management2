import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubscriptionsService } from './subscriptions.service';
import { CsvProcessorService } from './csv-processor.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

interface ProcessingResult {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  errors: string[];
  summary: string;
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly csvProcessorService: CsvProcessorService,
  ) {}

  @Post()
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }

  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCSV(@UploadedFile() file: Express.Multer.File): Promise<{
    success: boolean;
    message: string;
    data: ProcessingResult;
  }> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Le fichier doit être au format CSV');
    }

    try {
      const result = await this.csvProcessorService.processCSVFile(file.buffer);
      return {
        success: true,
        message: 'Fichier CSV traité avec succès',
        data: result,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      throw new BadRequestException(
        `Erreur lors du traitement: ${errorMessage}`,
      );
    }
  }

  // Nouvel endpoint pour Excel
  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File): Promise<{
    success: boolean;
    message: string;
    data: ProcessingResult;
  }> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const isExcel =
      file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls');
    const isCSV = file.originalname.endsWith('.csv');

    if (!isExcel && !isCSV) {
      throw new BadRequestException(
        'Le fichier doit être au format CSV ou Excel',
      );
    }

    try {
      let result: ProcessingResult;

      if (isExcel) {
        result = await this.csvProcessorService.processExcelFile(file.buffer);
      } else {
        result = await this.csvProcessorService.processCSVFile(file.buffer);
      }

      return {
        success: true,
        message: isExcel
          ? 'Fichier Excel traité avec succès'
          : 'Fichier CSV traité avec succès',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(
        `Erreur lors du traitement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
    }
  }

  @Get('tarifs/unique')
  getUniqueTarifs() {
    return this.subscriptionsService.getUniqueTarifs();
  }

  @Get('stats')
  async getStats() {
    return this.subscriptionsService.getStats();
  }
}
