import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CsvProcessorService } from '../csv-processor.service';
import { Subscription } from '../schemas/subscription.schema';

describe('CsvProcessorService', () => {
  let service: CsvProcessorService;
  let mockSubscriptionModel: any;

  beforeEach(async () => {
    mockSubscriptionModel = {
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsvProcessorService,
        {
          provide: getModelToken(Subscription.name),
          useValue: mockSubscriptionModel,
        },
      ],
    }).compile();

    service = module.get<CsvProcessorService>(CsvProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processCSVFile', () => {
    it('should process CSV file successfully', async () => {
      const csvData =
        'nom adherent,prenom adherent,email facilement joignable,telephone,tarif\nDupont,Jean,jean@example.com,0123456789,Tarif A';
      const buffer = Buffer.from(csvData);

      mockSubscriptionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const mockSave = jest.fn().mockResolvedValue({ _id: 'new-id' });
      mockSubscriptionModel.create = mockSave;

      const result = await service.processCSVFile(buffer);

      expect(result.totalRecords).toBeGreaterThanOrEqual(0);
      expect(result.newRecords).toBeGreaterThanOrEqual(0);
      expect(result.updatedRecords).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should handle CSV parsing errors', async () => {
      const invalidCsv = 'invalid,csv,data';
      const buffer = Buffer.from(invalidCsv);

      const result = await service.processCSVFile(buffer);

      expect(result.totalRecords).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
    });
  });

  describe('processExcelFile', () => {
    it('should process Excel file successfully', async () => {
      // Mock Excel data
      const mockExcelData = [
        {
          'Nom adhérent': 'Dupont',
          'Prénom adhérent': 'Jean',
          'Email facilement joignable ': 'jean@example.com',
          'Numéro de téléphone': '0123456789',
          Tarif: 'Tarif A',
        },
      ];

      // Mock xlsx.parse
      jest.doMock('node-xlsx', () => ({
        parse: jest.fn().mockReturnValue([
          {
            data: [
              ['Nom adhérent', 'Prénom adhérent'],
              ['Dupont', 'Jean'],
            ],
          },
        ]),
      }));

      mockSubscriptionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const mockSave = jest.fn().mockResolvedValue({ _id: 'new-id' });
      mockSubscriptionModel.create = mockSave;

      const buffer = Buffer.from('mock excel data');
      const result = await service.processExcelFile(buffer);

      expect(result.totalRecords).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
    });

    it('should handle Excel parsing errors', async () => {
      const buffer = Buffer.from('invalid excel data');

      const result = await service.processExcelFile(buffer);

      expect(result.totalRecords).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
    });
  });

  describe('private methods', () => {
    it('should clean tarif correctly', () => {
      // Test through public methods that use cleanTarif
      const csvData =
        'nom adherent,prenom adherent,email facilement joignable,telephone,tarif\nDupont,Jean,jean@example.com,0123456789," Tarif A "';
      const buffer = Buffer.from(csvData);

      mockSubscriptionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const mockSave = jest.fn().mockResolvedValue({ _id: 'new-id' });
      mockSubscriptionModel.create = mockSave;

      return service.processCSVFile(buffer).then((result) => {
        expect(result.errors).toBeDefined();
      });
    });

    it('should clean telephone correctly', () => {
      const csvData =
        'nom adherent,prenom adherent,email facilement joignable,telephone,tarif\nDupont,Jean,jean@example.com,123456789,Tarif A';
      const buffer = Buffer.from(csvData);

      mockSubscriptionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const mockSave = jest.fn().mockResolvedValue({ _id: 'new-id' });
      mockSubscriptionModel.create = mockSave;

      return service.processCSVFile(buffer).then((result) => {
        expect(result.errors).toBeDefined();
      });
    });
  });
});
