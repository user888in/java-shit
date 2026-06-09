import { Test, TestingModule } from '@nestjs/testing';
import { IntelligenceService } from '../src/services/IntelligenceService';
import { ProspectService } from '../src/services/ProspectService';
import { Prospect } from '../src/models/Prospect';

describe('IntelligenceService', () => {
  let service: IntelligenceService;
  let prospectService: ProspectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligenceService,
        {
          provide: ProspectService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IntelligenceService>(IntelligenceService);
    prospectService = module.get<ProspectService>(ProspectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('gatherIntelligence', () => {
    it('should gather intelligence for a prospect', async () => {
      const mockProspect = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Example Realty',
        website: 'https://example.com',
        intelligenceData: {}
      };

      // Mock the prospect service
      jest.spyOn(prospectService, 'findOne').mockResolvedValue(mockProspect as any);

      // Mock the internal gathering methods to return test data
      // In a real test, we'd mock each of the private methods or use dependency injection
      // For simplicity, we'll just test that the method calls the prospect service
      const result = await service.gatherIntelligence(mockProspect);

      expect(prospectService.findOne).toHaveBeenCalledWith(mockProspect.id);
      // In a full implementation, we'd assert on the returned intelligence data
    });
  });
});