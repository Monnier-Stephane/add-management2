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

    await expect(service.findOne('123')).rejects.toThrow('Subscription avec l\'ID "123" non trouvée');
  });

  it('should update a subscription', async () => {
    const fakeSubscription = { nom: 'Dupont', prenom: 'Jean' };
    (mockSubscriptionModel as any).findByIdAndUpdate = jest.fn().mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(fakeSubscription),
    });

    const result = await service.update('123', fakeSubscription);
    expect(result).toEqual(fakeSubscription);
  });

  it('should delete a subscription', async () => {
    const fakeSubscription = { nom: 'Dupont', prenom: 'Jean' };
    (mockSubscriptionModel as any).findByIdAndDelete = jest.fn().mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(fakeSubscription),
    });

    const result = await service.remove('123');
    expect(result).toEqual(fakeSubscription);
  });

  it('should throw NotFoundException if subscription not found for deletion', async () => {
    (mockSubscriptionModel as any).findByIdAndDelete = jest.fn().mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.remove('123')).rejects.toThrow('Subscription avec l\'ID "123" non trouvée');
  });
});
