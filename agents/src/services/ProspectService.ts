import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Prospect } from '../models/Prospect';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import { scraperUtils } from '../utils/scraperUtils';
import { linkedinUtils } from '../utils/linkedinUtils';

@Injectable()
export class ProspectService {
  constructor(
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
  ) {}

  async create(createProspectDto: CreateProspectDto): Promise<Prospect> {
    const prospect = this.prospectRepository.create(createProspectDto);
    return await this.prospectRepository.save(prospect);
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
    activeOnly?: boolean;
    canContactOnly?: boolean;
    specialization?: string;
    minListings?: number;
  }): Promise<[Prospect[], number]> {
    const queryBuilder = this.prospectRepository.createQueryBuilder('prospect');

    if (options?.activeOnly !== undefined) {
      queryBuilder.andWhere('prospect.isActive = :active', { active: options.activeOnly });
    }

    if (options?.canContactOnly !== undefined) {
      queryBuilder.andWhere('prospect.canContact = :canContact', { canContact: options.canContactOnly });
    }

    if (options?.specialization) {
      queryBuilder.andWhere('prospect.specializations @> :specialization', { specialization: `[${options.specialization}]` });
    }

    if (options?.minListings !== undefined) {
      queryBuilder.andWhere('prospect.listingsCount >= :minListings', { minListings: options.minListings });
    }

    queryBuilder.skip(options?.offset || 0);
    queryBuilder.take(options?.limit || 100);

    const [prospects, total] = await queryBuilder.getManyAndCount();
    return [prospects, total];
  }

  async findOne(id: number): Promise<Prospect> {
    return await this.prospectRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Prospect | null> {
    return await this.prospectRepository.findOne({ where: { email } });
  }

  async update(id: number, updateProspectDto: UpdateProspectDto): Promise<Prospect> {
    await this.prospectRepository.update(id, updateProspectDto);
    return await this.prospectRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.prospectRepository.delete(id);
  }

  async searchByCriteria(criteria: {
    location?: string;
    specialization?: string[];
    minExperienceYears?: number;
    maxExperienceYears?: number;
    hasWebsite?: boolean;
    recentActivityDays?: number;
  }): Promise<Prospect[]> {
    // This would typically integrate with external APIs like LinkedIn Sales Navigator,
    // local MLS systems, or real estate association directories
    // For now, we'll return an empty array as a placeholder
    // In implementation, this would call external services and save results
    return [];
  }

  async enrichProspectData(prospectId: number): Promise<Prospect> {
    const prospect = await this.findOne(prospectId);
    if (!prospect) {
      throw new Error(`Prospect with ID ${prospectId} not found`);
    }

    // Gather intelligence from various sources
    const intelligenceData = await this.gatherIntelligence(prospect);

    // Update prospect with gathered intelligence
    prospect.intelligenceData = intelligenceData;
    prospect.updatedAt = new Date();

    // Extract specific fields from intelligence data
    if (intelligenceData.listingsCount !== undefined) {
      prospect.listingsCount = intelligenceData.listingsCount;
    }

    if (intelligenceData.averageSalePrice !== undefined) {
      prospect.averageSalePrice = intelligenceData.averageSalePrice;
    }

    if (intelligenceData.yearlyTransactionVolume !== undefined) {
      prospect.yearlyTransactionVolume = intelligenceData.yearlyTransactionVolume;
    }

    if (intelligenceData.specializations !== undefined) {
      prospect.specializations = intelligenceData.specializations;
    }

    if (intelligenceData.techStack !== undefined) {
      prospect.techStack = intelligenceData.techStack;
    }

    if (intelligenceData.painPoints !== undefined) {
      prospect.painPoints = intelligenceData.painPoints;
    }

    if (intelligenceData.recentListings !== undefined) {
      prospect.recentListings = intelligenceData.recentListings;
    }

    if (intelligenceData.recentSales !== undefined) {
      prospect.recentSales = intelligenceData.recentSales;
    }

    if (intelligenceData.socialMediaProfiles !== undefined) {
      prospect.socialMediaProfiles = intelligenceData.socialMediaProfiles;
    }

    if (intelligenceData.bio !== undefined) {
      prospect.bio = intelligenceData.bio;
    }

    return await this.prospectRepository.save(prospect);
  }

  private async gatherIntelligence(prospect: Prospect): Promise<any> {
    const intelligenceData: any = {};

    try {
      // Scrape website if available
      if (prospect.website) {
        const websiteData = await scraperUtils.analyzeWebsite(prospect.website);
        intelligenceData.techStack = websiteData.techStack || {};
        intelligenceData.hasIdx = websiteData.hasIdx || false;
        intelligenceData.leadCaptureForms = websiteData.leadCaptureForms || 0;
        intelligenceData.blogPostCount = websiteData.blogPostCount || 0;
      }

      // Scrape social media profiles
      if (prospect.socialMediaProfiles && prospect.socialMediaProfiles.length > 0) {
        const socialData = await scraperUtils.analyzeSocialMedia(prospect.socialMediaProfiles);
        intelligenceData.socialMediaEngagement = socialData.engagementRate || 0;
        intelligenceData.postingFrequency = socialData.postingFrequency || 0;
        intelligenceData.contentTopics = socialData.contentTopics || [];
        intelligenceData.followerCount = socialData.followerCount || 0;
      }

      // Get LinkedIn data if available
      if (prospect.email) {
        try {
          const linkedinData = await linkedinUtils.getProfileByEmail(prospect.email);
          if (linkedinData) {
            intelligenceData.linkedinProfile = linkedinData;
            intelligenceData.yearsExperience = linkedinData.yearsExperience;
            intelligenceData.currentPosition = linkedinData.currentPosition;
            intelligenceData.education = linkedinData.education;
            intelligenceData.skills = linkedinData.skills;
          }
        } catch (error) {
          // LinkedIn data might not be available or rate limited
          console.warn(`Could not fetch LinkedIn data for ${prospect.email}:`, error.message);
        }
      }

      // Try to get real estate-specific data from public sources
      const propertyData = await scraperUtils.getPropertyRecords(prospect);
      if (propertyData) {
        intelligenceData.recentListings = propertyData.recentListings || [];
        intelligenceData.recentSales = propertyData.recentSales || [];
        intelligenceData.averageSalePrice = propertyData.averageSalePrice || prospect.averageSalePrice;
        intelligenceData.listingsCount = propertyData.listingsCount || prospect.listingsCount;
      }

      // Look for news mentions or press releases
      const newsData = await scraperUtils.searchNews(`${prospect.firstName} ${prospect.lastName} ${prospect.company}`);
      intelligenceData.mentions = newsData.articles || [];
      intelligenceData.awards = newsData.awards || [];
      intelligenceData.eventParticipation = newsData.events || [];

    } catch (error) {
      console.error(`Error gathering intelligence for prospect ${prospect.id}:`, error);
      // Continue with whatever data we managed to gather
    }

    return intelligenceData;
  }
}