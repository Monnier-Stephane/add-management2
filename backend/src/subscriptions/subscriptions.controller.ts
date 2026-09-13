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
import {
  SubscriptionsService,
  SubscriptionStats,
} from './subscriptions.service';
import { CsvProcessorService } from './csv-processor.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Roles } from '../auth/roles.decorator';
import { PhotoUploadService } from './photo-upload.service';
import { PdfUploadService } from './pdf-upload.service';
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
    private readonly photoUploadService: PhotoUploadService,
    private readonly pdfUploadService: PdfUploadService,
    
  ) {}


  @Post('attendance-pdf')
@UseInterceptors(FileInterceptor('file'))
async uploadAttendancePdf(
  @UploadedFile() file: Express.Multer.File,
  @Body('courseId') courseId: string,
  @Body('courseDate') courseDate: string,
) {
  if (!file) {
    throw new BadRequestException('Aucun fichier fourni');
  }
  if (file.mimetype !== 'application/pdf') {
    throw new BadRequestException('Le fichier doit être un PDF');
  }
  if (!courseId?.trim()) {
    throw new BadRequestException('courseId manquant');
  }

  const parsedDate = courseDate ? new Date(courseDate) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    throw new BadRequestException('courseDate invalide');
  }

  const uploaded = await this.pdfUploadService.uploadAttendancePdf(
    file,
    courseId.trim(),
    parsedDate,
  );

  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
}

@Get('attendance-pdf')
@Roles('admin')
async listAttendancePdfs() {
  return this.pdfUploadService.listAttendancePdfs();
}
  @Post()
  @Roles('admin')
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Le fichier doit être une image');
    }

    const uploaded = await this.photoUploadService.uploadStudentPhoto(file, id);

    return this.subscriptionsService.update(id, {
      photoUrl: uploaded.secure_url,
      photoPublicId: uploaded.public_id,
    });
  }

  @Delete(':id/photo')
  async removePhoto(@Param('id') id: string) {
    const student = await this.subscriptionsService.findOne(id);
    const publicId = (student as { photoPublicId?: string }).photoPublicId;
    if (publicId) {
      await this.photoUploadService.deleteStudentPhoto(publicId);
    }
    return this.subscriptionsService.clearPhoto(id);
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
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }

  @Post('upload-csv')
  @Roles('admin')
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
  @Roles('admin')
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
  getUniqueTarifs(): Promise<string[]> {
    return this.subscriptionsService.getUniqueTarifs();
  }

  @Get('stats')
  @Roles('admin')
  async getStats(): Promise<SubscriptionStats> {
    return this.subscriptionsService.getStats();
  }
}
