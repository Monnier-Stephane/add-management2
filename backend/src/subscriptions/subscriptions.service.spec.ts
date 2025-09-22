import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './schemas/subscription.schema';

// Mock constructor to simulate Mongoose model
const mockSave = jest.fn().mockResolvedValue({
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@email.com',
  telephone: '0600000000',
  dateDeNaissance: new Date('2000-01-01'),
  adresse: '1 rue de Paris',
  ville: 'Paris',
  codePostal: '75000',
  tarif: 'normal',
});

const mockSubscriptionModel = jest.fn().mockImplementation(function (dto) {
  Object.assign(this, dto);
  this.save = mockSave;
});

// Add static 'find' method to constructor
(mockSubscriptionModel as any).find = jest.fn();

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getModelToken(Subscription.name),
          useValue: mockSubscriptionModel,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  beforeEach(() => {
    // Reset mock before each test
    (mockSubscriptionModel as any).find.mockReset();
  });

  it('should create a subscription', async () => {
    const fakeSubscription = {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@email.com',
      telephone: '0600000000',
      dateDeNaissance: new Date('2000-01-01'),
      adresse: '1 rue de Paris',
      ville: 'Paris',
      codePostal: '75000',
      tarif: 'normal',
    };

    const result = await service.create(fakeSubscription);

    expect(result.nom).toBe('Dupont');
    expect(result.email).toBe('jean.dupont@email.com');
  });

  it('should return all subscriptions', async () => {
    const fakeList = [
      { nom: 'Dupont', prenom: 'Jean' },
      { nom: 'Martin', prenom: 'Claire' },
    ];
    (mockSubscriptionModel as any).find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(fakeList),
    });

    const result = await service.findAll();
    expect(result).toEqual(fakeList);
  });

  it('should return a subscription by ID', async () => {
    const fakeSubscription = { nom: 'Dupont', prenom: 'Jean' };
    (mockSubscriptionModel as any).findById = jest.fn().mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(fakeSubscription),
    });

    const result = await service.findOne('123');
    expect(result).toEqual(fakeSubscription);
  });

  it('should throw NotFoundException if subscription not found', async () => {
    (mockSubscriptionModel as any).findById = jest.fn().mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.findOne('123')).rejects.toThrow(
      'Subscription with ID "123" not found',
    );
  });

  it('should update a subscription', async () => {
    const fakeSubscription = { nom: 'Dupont', prenom: 'Jean' };
    (mockSubscriptionModel as any).findByIdAndUpdate = jest
      .fn()
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(fakeSubscription),
      });

    const result = await service.update('123', fakeSubscription);
    expect(result).toEqual(fakeSubscription);
  });

  it('should delete a subscription', async () => {
    const fakeSubscription = { nom: 'Dupont', prenom: 'Jean' };
    (mockSubscriptionModel as any).findByIdAndDelete = jest
      .fn()
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(fakeSubscription),
      });

    const result = await service.remove('123');
    expect(result).toEqual(fakeSubscription);
  });

  it('should throw NotFoundException if subscription not found for deletion', async () => {
    (mockSubscriptionModel as any).findByIdAndDelete = jest
      .fn()
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

    await expect(service.remove('123')).rejects.toThrow(
      'Subscription with ID "123" not found',
    );
  });

  it('should return unique tarifs', async () => {
    const mockTarifs = ['LUNDI 19h30 Bercy ADULTES', 'MERCREDI 12h15 Paris Châtelet ENFANTS', ''];
    (mockSubscriptionModel as any).distinct = jest.fn().mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockTarifs),
    });

    const result = await service.getUniqueTarifs();
    expect(result).toEqual(['LUNDI 19h30 Bercy ADULTES', 'MERCREDI 12h15 Paris Châtelet ENFANTS']);
  });

  it('should filter out empty and null tarifs', async () => {
    const mockTarifs = ['Valid Tarif', '', null, 'Another Valid Tarif', '   '];
    (mockSubscriptionModel as any).distinct = jest.fn().mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockTarifs),
    });

    const result = await service.getUniqueTarifs();
    expect(result).toEqual(['Valid Tarif', 'Another Valid Tarif']);
  });

  it('should return empty array when no tarifs found', async () => {
    (mockSubscriptionModel as any).distinct = jest.fn().mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue([]),
    });

    const result = await service.getUniqueTarifs();
    expect(result).toEqual([]);
  });

  it('should return statistics for subscriptions', async () => {
    const mockSubscriptions = [
      { statutPaiement: 'payé', tarif: 'LUNDI 19h30 Bercy ADULTES' },
      { statutPaiement: 'en attente', tarif: 'MERCREDI 12h15 Paris Châtelet ENFANTS' },
      { statutPaiement: 'payé', tarif: 'SAMEDI 10h00 Choisy ADOS' },
      { statutPaiement: 'payé', tarif: 'DIMANCHE 11h30 Choisy ADULTES' },
      { statutPaiement: 'en attente', tarif: 'TARIF ENFANT' },
    ];
    (mockSubscriptionModel as any).find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockSubscriptions),
    });

    const result = await service.getStats();
    expect(result).toEqual({
      total: 5,
      attente: 2,
      paye: 3,
      enfants: 2,
      ados: 1,
      adultes: 2
    });
  });

  it('should handle empty subscriptions array in getStats', async () => {
    (mockSubscriptionModel as any).find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue([]),
    });

    const result = await service.getStats();
    expect(result).toEqual({
      total: 0,
      attente: 0,
      paye: 0,
      enfants: 0,
      ados: 0,
      adultes: 0
    });
  });

  it('should handle subscriptions with missing fields in getStats', async () => {
    const mockSubscriptions = [
      { statutPaiement: 'payé', tarif: null },
      { statutPaiement: null, tarif: 'TARIF ENFANT' },
      { statutPaiement: 'payé', tarif: undefined },
      { statutPaiement: 'en attente', tarif: '' },
    ];
    (mockSubscriptionModel as any).find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockSubscriptions),
    });

    const result = await service.getStats();
    expect(result).toEqual({
      total: 4,
      attente: 1,
      paye: 2,
      enfants: 1,
      ados: 0,
      adultes: 0
    });
  });

  it('should handle mixed case in tarif for getStats', async () => {
    const mockSubscriptions = [
      { statutPaiement: 'payé', tarif: 'TARIF ENFANT' },
      { statutPaiement: 'payé', tarif: 'tarif ado' },
      { statutPaiement: 'payé', tarif: 'Tarif Adulte' },
    ];
    (mockSubscriptionModel as any).find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockSubscriptions),
    });

    const result = await service.getStats();
    expect(result).toEqual({
      total: 3,
      attente: 0,
      paye: 3,
      enfants: 1,
      ados: 1,
      adultes: 1
    });
  });

  it('should handle partial matches in tarif for getStats', async () => {
    const mockSubscriptions = [
      { statutPaiement: 'payé', tarif: 'COURS ENFANT' },
      { statutPaiement: 'payé', tarif: 'ADOLESCENT' },
      { statutPaiement: 'payé', tarif: 'ADULTE' },
    ];
    (mockSubscriptionModel as any).find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockSubscriptions),
    });

    const result = await service.getStats();
    expect(result).toEqual({
      total: 3,
      attente: 0,
      paye: 3,
      enfants: 1,
      ados: 1,
      adultes: 1
    });
  });

  it('should handle subscriptions with empty objects in getStats', async () => {
    const mockSubscriptions = [{}, {}, {}];
    (mockSubscriptionModel as any).find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockSubscriptions),
    });

    const result = await service.getStats();
    expect(result).toEqual({
      total: 3,
      attente: 0,
      paye: 0,
      enfants: 0,
      ados: 0,
      adultes: 0
    });
  });

  it('should handle subscriptions with special characters in tarif for getStats', async () => {
    const mockSubscriptions = [
      { statutPaiement: 'payé', tarif: 'TARIF-ENFANT' },
      { statutPaiement: 'payé', tarif: 'TARIF_ADO' },
      { statutPaiement: 'payé', tarif: 'TARIF.ADULTE' },
    ];
    (mockSubscriptionModel as any).find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockSubscriptions),
    });

    const result = await service.getStats();
    expect(result).toEqual({
      total: 3,
      attente: 0,
      paye: 3,
      enfants: 1,
      ados: 1,
      adultes: 1
    });
  });

  it('should handle subscriptions with very long tarif strings in getStats', async () => {
    const longTarif = 'A'.repeat(1000) + 'ENFANT' + 'B'.repeat(1000);
    const mockSubscriptions = [
      { statutPaiement: 'payé', tarif: longTarif },
    ];
    (mockSubscriptionModel as any).find.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(mockSubscriptions),
    });

    const result = await service.getStats();
    expect(result).toEqual({
      total: 1,
      attente: 0,
      paye: 1,
      enfants: 1,
      ados: 0,
      adultes: 0
    });
  });
});
