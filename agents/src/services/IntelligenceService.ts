import { Injectable } from '@nestjs/common';
import { Prospect } from '../models/Prospect';
import { scraperUtils } from '../utils/scraperUtils';
import { linkedinUtils } from '../utils/linkedinUtils';
import { propertyUtils } from '../utils/propertyUtils';
import { newsUtils } from '../utils/newsUtils';

@Injectable()
export class IntelligenceService {
  /**
   * Gather all intelligence for a prospect
   * @param prospect The prospect to gather intelligence on
   * @returns Intelligence data object
   */
  async gatherIntelligence(prospect: Prospect): Promise<any> {
    const intelligenceData: any = {};

    try {
      // Gather professional profile
      const professionalProfile = await this.gatherProfessionalProfile(prospect);
      Object.assign(intelligenceData, professionalProfile);

      // Gather digital footprint
      const digitalFootprint = await this.gatherDigitalFootprint(prospect);
      Object.assign(intelligenceData, digitalFootprint);

      // Gather business intelligence
      const businessIntelligence = await this.gatherBusinessIntelligence(prospect);
      Object.assign(intelligenceData, businessIntelligence);

      // Gather pain point indicators
      const painPointIndicators = await this.gatherPainPointIndicators(prospect);
      Object.assign(intelligenceData, painPointIndicators);

    } catch (error) {
      console.error(`Error gathering intelligence for prospect ${prospect.id}:`, error);
      // We'll return whatever we managed to gather so far
    }

    return intelligenceData;
  }

  /**
   * Gather professional profile information
   */
  private async gatherProfessionalProfile(prospect: Prospect): Promise<any> {
    const profile: any = {};

    // Try to get LinkedIn data
    if (prospect.email) {
      try {
        const linkedinData = await linkedinUtils.getProfileByEmail(prospect.email);
        if (linkedinData) {
          profile.linkedinProfile = linkedinData;
          profile.yearsExperience = linkedinData.yearsExperience;
          profile.currentPosition = linkedinData.currentPosition;
          profile.education = linkedinData.education;
          profile.skills = linkedinData.skills;
          profile.licenseNumber = linkedinData.licenseNumber || prospect.licenseNumber;
        }
      } catch (error) {
        console.warn(`Could not fetch LinkedIn data for ${prospect.email}:`, error.message);
      }
    }

    // If we don't have license number from LinkedIn, try to get it from other sources
    if (!profile.licenseNumber) {
      // This would typically involve checking state real estate commission websites
      // For now, we leave it as is (might be filled from initial data)
    }

    return profile;
  }

  /**
   * Gather digital footprint information
   */
  private async gatherDigitalFootprint(prospect: Prospect): Promise<any> {
    const footprint: any = {};

    // Analyze website if available
    if (prospect.website) {
      try {
        const websiteData = await scraperUtils.analyzeWebsite(prospect.website);
        footprint.techStack = websiteData.techStack || {};
        footprint.hasIdx = websiteData.hasIdx || false;
        footprint.leadCaptureForms = websiteData.leadCaptureForms || 0;
        footprint.blogPostCount = websiteData.blogPostCount || 0;
        footprint.websiteTrafficEstimate = websiteData.trafficEstimate || 0;
        footprint.domainAge = websiteData.domainAge || 0;
      } catch (error) {
        console.warn(`Could not analyze website for ${prospect.website}:`, error.message);
      }
    }

    // Analyze social media profiles
    if (prospect.socialMediaProfiles && prospect.socialMediaProfiles.length > 0) {
      try {
        const socialData = await scraperUtils.analyzeSocialMedia(prospect.socialMediaProfiles);
        footprint.socialMediaEngagement = socialData.engagementRate || 0;
        footprint.postingFrequency = socialData.postingFrequency || 0;
        footprint.contentTopics = socialData.contentTopics || [];
        footprint.followerCount = socialData.followerCount || 0;
        footprint.profileCompleteness = socialData.profileCompleteness || 0;
      } catch (error) {
        console.warn(`Could not analyze social media for prospect ${prospect.id}:`, error.message);
      }
    }

    return footprint;
  }

  /**
   * Gather business intelligence
   */
  private async gatherBusinessIntelligence(prospect: Prospect): Promise<any> {
    const intel: any = {};

    // Get property records and transaction history
    try {
      const propertyData = await propertyUtils.getPropertyRecords(prospect);
      if (propertyData) {
        intel.recentListings = propertyData.recentListings || [];
        intel.recentSales = propertyData.recentSales || [];
        intel.averageSalePrice = propertyData.averageSalePrice || prospect.averageSalePrice;
        intel.listingsCount = propertyData.listingsCount || prospect.listingsCount;
        intel.yearlyTransactionVolume = propertyData.yearlyTransactionVolume || prospect.yearlyTransactionVolume;
        intel.averageDaysOnMarket = propertyData.averageDaysOnMarket || 0;
        intel.priceReductionFrequency = propertyData.priceReductionFrequency || 0;
      }
    } catch (error) {
      console.warn(`Could not get property records for prospect ${prospect.id}:`, error.message);
    }

    // Check for team size and hiring patterns
    try {
      const teamData = await scraperUtils.getTeamInfo(prospect);
      if (teamData) {
        intel.teamSize = teamData.teamSize || 1;
        intel.recentHires = teamData.recentHires || [];
        intel.recentDepartures = teamData.recentDepartures || [];
        intel.officeLocations = teamData.officeLocations || [];
      }
    } catch (error) {
      console.warn(`Could not get team info for prospect ${prospect.id}:`, error.message);
    }

    // Check for certifications and designations
    try {
      const certData = await scraperUtils.getCertifications(prospect);
      if (certData) {
        intel.certifications = certData.certifications || [];
        intel.designations = certData.designations || [];
      }
    } catch (error) {
      console.warn(`Could not get certifications for prospect ${prospect.id}:`, error.message);
    }

    return intel;
  }

  /**
   * Gather pain point indicators
   */
  private async gatherPainPointIndicators(prospect: Prospect): Promise<any> {
    const indicators: any = {};

    // Analyze content for mentions of pain points
    try {
      const contentAnalysis = await scraperUtils.analyzeContentForPainPoints(prospect);
      if (contentAnalysis) {
        indicators.leadGenerationChallenges = contentAnalysis.leadGenerationChallenges || false;
        indicators.technologyComplaints = contentAnalysis.technologyComplaints || false;
        indicators.administrativeBurden = contentAnalysis.administrativeBurden || false;
        indicators.marketingEffectivenessConcerns = contentAnalysis.marketingEffectivenessConcerns || false;
        indicators.clientCommunicationIssues = contentAnalysis.clientCommunicationIssues || false;
        indicators.followUpSystemGaps = contentAnalysis.followUpSystemGaps || false;
      }
    } catch (error) {
      console.warn(`Could not analyze content for pain points for prospect ${prospect.id}:`, error.message);
    }

    // Look for reviews and testimonials that might indicate pain points
    try {
      const reviewData = await scraperUtils.getReviews(prospect);
      if (reviewData) {
        indicators.averageRating = reviewData.averageRating || 0;
        indicators.reviewCount = reviewData.reviewCount || 0;
        indicators.commonComplaints = reviewData.commonComplaints || [];
        indicators.commonPraises = reviewData.commonPraises || [];
      }
    } catch (error) {
      console.warn(`Could not get reviews for prospect ${prospect.id}:`, error.message);
    }

    // Check for technology gaps by comparing to local market averages
    try {
      const techGapData = await scraperUtils.analyzeTechGaps(prospect);
      if (techGapData) {
        indicators.techStackGaps = techGapData.gaps || [];
        indicators.marketingTechGap = techGapData.marketingTechGap || false;
        indicators.crmGap = techGapData.crmGap || false;
        indicators.leadNurturingGap = techGapData.leadNurturingGap || false;
      }
    } catch (error) {
      console.warn(`Could not analyze tech gaps for prospect ${prospect.id}:`, error.message);
    }

    return indicators;
  }
}