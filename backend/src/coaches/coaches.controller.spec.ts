import { Test, TestingModule } from '@nestjs/testing';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { Coach } from './schemas/coach.schema';

describe('CoachesController', () => {
  let controller: CoachesController;
  let service: CoachesService;

  const mockCoach = {
    _id: '507f1f77bcf86cd799439011',
    nom: 'Test',
    prenom: 'Coach',
    email: 'test@example.com',
    statut: 'coach',
  };

  beforeEach(async () => {
    const mockCoachesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoachesController],
      providers: [
        {
          provide: CoachesService,
          useValue: mockCoachesService,
        },
      ],
    }).compile();

    controller = module.get<CoachesController>(CoachesController);
    service = module.get<CoachesService>(CoachesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a coach', async () => {
      const createCoachDto: CreateCoachDto = {
        nom: 'Test',
        prenom: 'Coach',
        email: 'test@example.com',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockCoach as Coach);

      const result = await controller.create(createCoachDto);

      expect(service.create).toHaveBeenCalledWith(createCoachDto);
      expect(result).toEqual(mockCoach);
    });
  });

  describe('findAll', () => {
    it('should return an array of coaches', async () => {
      const coaches = [mockCoach];
      jest.spyOn(service, 'findAll').mockResolvedValue(coaches as Coach[]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(coaches);
    });
  });

  describe('findOne', () => {
    it('should return a coach by id', async () => {
      const id = '507f1f77bcf86cd799439011';
      jest.spyOn(service, 'findOne').mockResolvedValue(mockCoach as Coach);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockCoach);
    });
  });

  describe('update', () => {
    it('should update a coach', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateCoachDto: UpdateCoachDto = { nom: 'Updated' };
      const updatedCoach = { ...mockCoach, ...updateCoachDto };

      jest.spyOn(service, 'update').mockResolvedValue(updatedCoach as Coach);

      const result = await controller.update(id, updateCoachDto);

      expect(service.update).toHaveBeenCalledWith(id, updateCoachDto);
      expect(result).toEqual(updatedCoach);
    });
  });

  describe('remove', () => {
    it('should delete a coach', async () => {
      const id = '507f1f77bcf86cd799439011';
      jest.spyOn(service, 'remove').mockResolvedValue(mockCoach as Coach);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockCoach);
    });
  });
});
