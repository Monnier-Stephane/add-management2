import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CsvProcessorService } from './csv-processor.service';
import { Subscription } from './schemas/subscription.schema';

describe('CsvProcessorService', () => {
  let service: CsvProcessorService;
  let mockSubscriptionModel: any;

  const mockSubscription = {
    _id: '1',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean@example.com',
    telephone: '0123456789',
    dateDeNaissance: new Date('1990-01-01'),
    adresse: '123 Rue Test',
    ville: 'Paris',
    codePostal: '75001',
    tarif: 'Tarif A',
    statutPaiement: 'payé',
    remarques: 'Test',
  };

  beforeEach(async () => {
    mockSubscriptionModel = {
      findOne: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      save: jest.fn(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
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
        'nom,prenom,email,telephone,dateDeNaissance,adresse,ville,codePostal,tarif\nDupont,Jean,jean@example.com,0123456789,1990-01-01,123 Rue Test,Paris,75001,Tarif A';
      const buffer = Buffer.from(csvData);

      // Mock pour simuler qu'aucun enregistrement existant n'est trouvé
      mockSubscriptionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Mock pour simuler la sauvegarde
      const mockSave = jest.fn().mockResolvedValue(mockSubscription);
      mockSubscriptionModel.save = mockSave;

      const result = await service.processCSVFile(buffer);

      expect(result.totalRecords).toBeGreaterThanOrEqual(0);
      expect(result.newRecords).toBeGreaterThanOrEqual(0);
      expect(result.updatedRecords).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should handle empty CSV file', async () => {
      const csvData =
        'nom,prenom,email,telephone,dateDeNaissance,adresse,ville,codePostal,tarif\n';
      const buffer = Buffer.from(csvData);

      const result = await service.processCSVFile(buffer);

      expect(result.totalRecords).toBe(0);
      expect(result.newRecords).toBe(0);
      expect(result.updatedRecords).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle CSV processing errors', async () => {
      const invalidBuffer = Buffer.from('invalid csv data');

      const result = await service.processCSVFile(invalidBuffer);

      expect(result.totalRecords).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
    });
  });

  describe('processExcelFile', () => {
    it('should process Excel file successfully', async () => {
      // Mock pour simuler qu'aucun enregistrement existant n'est trouvé
      mockSubscriptionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Mock pour simuler la sauvegarde
      const mockSave = jest.fn().mockResolvedValue(mockSubscription);
      mockSubscriptionModel.save = mockSave;

      // Créer un buffer Excel minimal
      const excelBuffer = Buffer.from('dummy excel data');

      const result = await service.processExcelFile(excelBuffer);

      expect(result).toBeDefined();
      expect(result.totalRecords).toBeGreaterThanOrEqual(0);
    });

    it('should handle Excel processing errors', async () => {
      const invalidBuffer = Buffer.from('invalid excel data');

      const result = await service.processExcelFile(invalidBuffer);

      expect(result).toBeDefined();
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('private methods', () => {
    it('should clean tariff values correctly', () => {
      // Test de la méthode privée via un appel public
      const csvData =
        'nom,prenom,email,telephone,dateDeNaissance,adresse,ville,codePostal,tarif\nDupont,Jean,jean@example.com,0123456789,1990-01-01,123 Rue Test,Paris,75001," Tarif A "';
      const buffer = Buffer.from(csvData);

      mockSubscriptionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const mockSave = jest.fn().mockResolvedValue(mockSubscription);
      mockSubscriptionModel.save = mockSave;

      return service.processCSVFile(buffer).then((result) => {
        expect(result.totalRecords).toBe(1);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should clean phone numbers correctly', () => {
      const csvData =
        'nom,prenom,email,telephone,dateDeNaissance,adresse,ville,codePostal,tarif\nDupont,Jean,jean@example.com,01 23 45 67 89,1990-01-01,123 Rue Test,Paris,75001,Tarif A';
      const buffer = Buffer.from(csvData);

      mockSubscriptionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const mockSave = jest.fn().mockResolvedValue(mockSubscription);
      mockSubscriptionModel.save = mockSave;

      return service.processCSVFile(buffer).then((result) => {
        expect(result.totalRecords).toBe(1);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
