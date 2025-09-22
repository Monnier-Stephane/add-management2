import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { CoachesService } from './coaches.service';
import { Coach } from './schemas/coach.schema';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

describe('CoachesService', () => {
  let service: CoachesService;
  let mockCoachModel: any;

  const mockCoach = {
    _id: '507f1f77bcf86cd799439011',
    nom: 'Test',
    prenom: 'Coach',
    email: 'test@example.com',
    statut: 'coach',
  };

  beforeEach(async () => {
    // Mock du constructeur avec méthodes statiques
    mockCoachModel = jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(mockCoach),
    }));

    // Configuration des méthodes statiques
    mockCoachModel.find = jest.fn().mockReturnThis();
    mockCoachModel.exec = jest.fn();
    mockCoachModel.findById = jest.fn().mockReturnThis();
    mockCoachModel.findByIdAndUpdate = jest.fn().mockReturnThis();
    mockCoachModel.findByIdAndDelete = jest.fn().mockReturnThis();
    mockCoachModel.findOne = jest.fn().mockReturnThis();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachesService,
        {
          provide: getModelToken(Coach.name),
          useValue: mockCoachModel,
        },
      ],
    }).compile();

    service = module.get<CoachesService>(CoachesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new coach', async () => {
      const createCoachDto: CreateCoachDto = {
        nom: 'Test',
        prenom: 'Coach',
        email: 'test@example.com',
      };

      // Mock de l'instance retournée par le constructeur
      const mockInstance = { save: jest.fn().mockResolvedValue(mockCoach) };
      mockCoachModel.mockReturnValue(mockInstance);

      const result = await service.create(createCoachDto);

      expect(mockCoachModel).toHaveBeenCalledWith(createCoachDto);
      expect(mockInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockCoach);
    });
  });

  describe('findAll', () => {
    it('should return an array of coaches', async () => {
      const coaches = [mockCoach];
      mockCoachModel.exec.mockResolvedValue(coaches);

      const result = await service.findAll();

      expect(mockCoachModel.find).toHaveBeenCalled();
      expect(mockCoachModel.exec).toHaveBeenCalled();
      expect(result).toEqual(coaches);
    });
  });

  describe('findOne', () => {
    it('should return a coach by id', async () => {
      const id = '507f1f77bcf86cd799439011';
      mockCoachModel.exec.mockResolvedValue(mockCoach);

      const result = await service.findOne(id);

      expect(mockCoachModel.findById).toHaveBeenCalledWith(id);
      expect(mockCoachModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockCoach);
    });

    it('should throw NotFoundException when coach not found', async () => {
      const id = '507f1f77bcf86cd799439011';
      mockCoachModel.exec.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(mockCoachModel.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a coach', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateCoachDto: UpdateCoachDto = { nom: 'Updated' };
      const updatedCoach = { ...mockCoach, ...updateCoachDto };

      mockCoachModel.exec.mockResolvedValue(updatedCoach);

      const result = await service.update(id, updateCoachDto);

      expect(mockCoachModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        updateCoachDto,
        { new: true },
      );
      expect(mockCoachModel.exec).toHaveBeenCalled();
      expect(result).toEqual(updatedCoach);
    });

    it('should throw NotFoundException when coach not found', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateCoachDto: UpdateCoachDto = { nom: 'Updated' };

      mockCoachModel.exec.mockResolvedValue(null);

      await expect(service.update(id, updateCoachDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a coach', async () => {
      const id = '507f1f77bcf86cd799439011';
      mockCoachModel.exec.mockResolvedValue(mockCoach);

      const result = await service.remove(id);

      expect(mockCoachModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(mockCoachModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockCoach);
    });

    it('should throw NotFoundException when coach not found', async () => {
      const id = '507f1f77bcf86cd799439011';
      mockCoachModel.exec.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a coach by email', async () => {
      const email = 'test@example.com';
      mockCoachModel.exec.mockResolvedValue(mockCoach);

      const result = await service.findByEmail(email);

      expect(mockCoachModel.findOne).toHaveBeenCalledWith({ email });
      expect(mockCoachModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockCoach);
    });

    it('should return null when coach not found', async () => {
      const email = 'test@example.com';
      mockCoachModel.exec.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });
});
