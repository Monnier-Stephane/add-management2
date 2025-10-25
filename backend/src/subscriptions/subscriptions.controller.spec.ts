import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { CsvProcessorService } from './csv-processor.service';
import { BadRequestException } from '@nestjs/common';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: SubscriptionsService;
  let csvProcessorService: CsvProcessorService;

  const mockSubscriptionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getUniqueTarifs: jest.fn(),
  };

  const mockCsvProcessorService = {
    processCSVFile: jest.fn(),
    processExcelFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: CsvProcessorService,
          useValue: mockCsvProcessorService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    service = module.get<SubscriptionsService>(SubscriptionsService);
    csvProcessorService = module.get<CsvProcessorService>(CsvProcessorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a subscription', async () => {
      const createDto = {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@example.com',
        telephone: '0123456789',
        dateDeNaissance: new Date('1990-01-01'),
        adresse: '123 Rue Test',
        ville: 'Paris',
        codePostal: '75001',
        tarif: 'Tarif A',
      };
      const expectedResult = { id: '1', ...createDto };

      mockSubscriptionsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return all subscriptions', async () => {
      const expectedResult = [{ id: '1', nom: 'Dupont' }];

      mockSubscriptionsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a subscription by id', async () => {
      const id = '1';
      const expectedResult = { id, nom: 'Dupont' };

      mockSubscriptionsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a subscription', async () => {
      const id = '1';
      const updateDto = { nom: 'Martin' };
      const expectedResult = { id, ...updateDto };

      mockSubscriptionsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a subscription', async () => {
      const id = '1';
      const expectedResult = { id, nom: 'Dupont' };

      mockSubscriptionsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('uploadCSV', () => {
    it('should process CSV file successfully', async () => {
      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from('test data'),
      } as Express.Multer.File;

      const mockResult = {
        totalRecords: 10,
        newRecords: 5,
        updatedRecords: 5,
        errors: [],
        summary: 'Processing completed',
      };

      mockCsvProcessorService.processCSVFile.mockResolvedValue(mockResult);

      const result = await controller.uploadCSV(mockFile);

      expect(csvProcessorService.processCSVFile).toHaveBeenCalledWith(
        mockFile.buffer,
      );
      expect(result).toEqual({
        success: true,
        message: 'Fichier CSV traité avec succès',
        data: mockResult,
      });
    });

    it('should throw error if no file provided', async () => {
      await expect(controller.uploadCSV(undefined as any)).rejects.toThrow(
        new BadRequestException('Aucun fichier fourni'),
      );
    });

    it('should throw error if file is not CSV', async () => {
      const mockFile = {
        originalname: 'test.txt',
        buffer: Buffer.from('test data'),
      } as Express.Multer.File;

      await expect(controller.uploadCSV(mockFile)).rejects.toThrow(
        new BadRequestException('Le fichier doit être au format CSV'),
      );
    });

    it('should handle processing errors', async () => {
      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from('test data'),
      } as Express.Multer.File;

      mockCsvProcessorService.processCSVFile.mockRejectedValue(
        new Error('Processing failed'),
      );

      await expect(controller.uploadCSV(mockFile)).rejects.toThrow(
        new BadRequestException('Erreur lors du traitement: Processing failed'),
      );
    });
  });

  describe('uploadExcel', () => {
    it('should process Excel file successfully', async () => {
      const mockFile = {
        originalname: 'test.xlsx',
        buffer: Buffer.from('test data'),
      } as Express.Multer.File;

      const mockResult = {
        totalRecords: 10,
        newRecords: 5,
        updatedRecords: 5,
        errors: [],
        summary: 'Processing completed',
      };

      mockCsvProcessorService.processExcelFile.mockResolvedValue(mockResult);

      const result = await controller.uploadExcel(mockFile);

      expect(csvProcessorService.processExcelFile).toHaveBeenCalledWith(
        mockFile.buffer,
      );
      expect(result).toEqual({
        success: true,
        message: 'Fichier Excel traité avec succès',
        data: mockResult,
      });
    });

    it('should process CSV file through Excel endpoint', async () => {
      const mockFile = {
        originalname: 'test.csv',
        buffer: Buffer.from('test data'),
      } as Express.Multer.File;

      const mockResult = {
        totalRecords: 10,
        newRecords: 5,
        updatedRecords: 5,
        errors: [],
        summary: 'Processing completed',
      };

      mockCsvProcessorService.processCSVFile.mockResolvedValue(mockResult);

      const result = await controller.uploadExcel(mockFile);

      expect(csvProcessorService.processCSVFile).toHaveBeenCalledWith(
        mockFile.buffer,
      );
      expect(result).toEqual({
        success: true,
        message: 'Fichier CSV traité avec succès',
        data: mockResult,
      });
    });

    it('should throw error if file format is not supported', async () => {
      const mockFile = {
        originalname: 'test.txt',
        buffer: Buffer.from('test data'),
      } as Express.Multer.File;

      await expect(controller.uploadExcel(mockFile)).rejects.toThrow(
        new BadRequestException('Le fichier doit être au format CSV ou Excel'),
      );
    });
  });

  describe('getUniqueTarifs', () => {
    it('should return unique tarifs', async () => {
      const expectedResult = ['Tarif A', 'Tarif B'];

      mockSubscriptionsService.getUniqueTarifs.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getUniqueTarifs();

      expect(service.getUniqueTarifs).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});
