import { Test, TestingModule } from '@nestjs/testing';
import { ProspectService } from '../src/services/ProspectService';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Prospect } from '../src/models/Prospect';
import { Repository } from 'typeorm';

describe('ProspectService', () => {
  let service: ProspectService;
let prospectRepository: Repository<Prospect>;

  const mockProspectRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProspectService,
        {
          provide: getRepositoryToken(Prospect),
          useValue: mockProspectRepository,
        },
      ],
    }).compile();

    service = module.get<ProspectService>(ProspectService);
    prospectRepository = module.get<Repository<Prospect>>(
      getRepositoryToken(Prospect),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a prospect', async () => {
      const createProspectDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Example Realty'
      };

      const savedProspect = { id: 1, ...createProspectDto };
      mockProspectRepository.create.mockReturnValue(savedProspect);
      mockProspectRepository.save.mockResolvedValue(savedProspect);

      const result = await service.create(createProspectDto);
      expect(result).toEqual(savedProspect);
      expect(mockProspectRepository.create).toHaveBeenCalledWith(createProspectDto);
      expect(mockProspectRepository.save).toHaveBeenCalledWith(savedProspect);
    });
  });

  describe('findOne', () => {
    it('should find a prospect by ID', async () => {
      const prospectId = 1;
      const expectedProspect = {
        id: prospectId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Example Realty'
      };
      mockProspectRepository.findOne.mockResolvedValue(expectedProspect);

      const result = await service.findOne(prospectId);
      expect(result).toEqual(expectedProspect);
      expect(mockProspectRepository.findOne).toHaveBeenCalledWith({
        where: { id: prospectId }
      });
    });
  });

  describe('findByEmail', () => {
    it('should find a prospect by email', async () => {
      const email = 'john.doe@example.com';
      const expectedProspect = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email,
        company: 'Example Realty'
      };
      mockProspectRepository.findOne.mockResolvedValue(expectedProspect);

      const result = await service.findByEmail(email);
      expect(result).toEqual(expectedProspect);
      expect(mockProspectRepository.findOne).toHaveBeenCalledWith({
        where: { email }
      });
    });
  });
});