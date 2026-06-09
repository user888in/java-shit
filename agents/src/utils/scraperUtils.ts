import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import axios from 'axios';
import { URL } from 'url';

/**
 * Utility functions for web scraping and data gathering
 */
export const scraperUtils = {
  /**
   * Analyze a website to extract technology stack, lead capture forms, etc.
   * @param url The website URL to analyze
   * @returns Website analysis data
   */
  async analyzeWebsite(urlString: string): Promise<any> {
    try {
      // Validate URL
      const url = new URL(urlString);

      // Fetch the page
      const response = await axios.get(urlString, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      // Extract basic info
      const title = $('title').text().trim();
      const description = $('meta[name="description"]').attr('content') || '';

      // Detect technology stack
      const techStack: Record<string, boolean | string> = {};

      // Check for common real estate technologies
      const html = response.data.toLowerCase();

      // IDX/MLS providers
      techStack.idxBroker = html.includes('idxbroker') || html.includes('idxi Frame') || $('.idxbroker-frame').length > 0;
      techStack.moxiWorks = html.includes('moxiworks') || $('.moxi-present').length > 0;
      techStack.chime = html.includes('chimecrm') || $('.chime-widget').length > 0;
      techStack.followUpBoss = html.includes('followupboss') || $('#fub-widget').length > 0;
      techStack.sierraInteractive = html.includes('sierrainteractive') || $('.sierra-widget').length > 0;
      techStack.placester = html.includes('placester') || $('.placester-badge').length > 0;
      techStack.realGeeks = html.includes('realgeeks') || $('#rg-form').length > 0;
      techStack.zillow = html.includes('zillow') || $('.zillow-widget').length > 0;
      techStack.realtorCom = html.includes('realtor.com') || $('.realtor-widget').length > 0;

      // CRM systems
      techStack.salesforce = html.includes('salesforce') || $('[data-sfdc]').length > 0;
      techStack.hubspot = html.includes('hubspot') || $('[data-hubspot]').length > 0;
      techStack.zoho = html.includes('zoho') || $('[data-zoho]').length > 0;

      // Email marketing
      techStack.mailchimp = html.includes('mailchimp') || $('.mc-form').length > 0;
      techStack.constantContact = html.includes('constantcontact') || $('.ctct-form').length > 0;
      techStack.convertKit = html.includes('convertkit') || $('.ck-form').length > 0;

      // Lead capture forms
      const forms = $('form');
      let leadCaptureForms = 0;
      forms.each((_, form) => {
        const formHtml = $(form).html().toLowerCase();
        if (formHtml.includes('name') && (formHtml.includes('email') || formHtml.includes('phone'))) {
          leadCaptureForms++;
        }
      });

      // Check for blog
      const blogLinks = $('a[href*="blog"], a[href*="news"], a[href*="articles"]');
      const blogPostCount = blogLinks.length;

      // Estimate traffic (very rough)
      const trafficEstimate = this.estimateTrafficFromRank($, html);

      // Estimate domain age (would need WHOIS lookup in reality)
      const domainAge = this.estimateDomainAge(url.hostname);

      return {
        url: urlString,
        title,
        description,
        techStack,
        hasIdx: techStack.idxBroker || techStack.moxiWorks || techStack.chime || techStack.sierraInteractive || techStack.placester || techStack.realGeeks,
        leadCaptureForms,
        blogPostCount,
        trafficEstimate,
        domainAge,
        // Additional metrics
        mobileFriendly: this.checkMobileFriendly($),
        sslEnabled: url.protocol === 'https:',
        loadTime: 0 // Would need actual timing in reality
      };
    } catch (error) {
      console.error(`Error analyzing website ${urlString}:`, error.message);
      // Return minimal data on failure
      return {
        url: urlString,
        error: error.message,
        techStack: {},
        leadCaptureForms: 0,
        blogPostCount: 0
      };
    }
  },

  /**
   * Analyze social media profiles for engagement and content
   * @param profileUrls Array of social media profile URLs
   * @returns Social media analysis data
   */
  async analyzeSocialMedia(profileUrls: string[]): Promise<any> {
    // In a real implementation, we'd use official APIs or scraping
    // For now, return placeholder data
    return {
      engagementRate: Math.random() * 0.1, // 0-10%
      postingFrequency: Math.floor(Math.random() * 5), // posts per week
      contentTopics: ['listings', 'market updates', 'client testimonials'],
      followerCount: Math.floor(Math.random() * 10000),
      profileCompleteness: Math.random() * 0.8 + 0.2 // 20-100%
    };
  },

  /**
   * Get property records for a prospect
   * @param prospect The prospect to get property data for
   * @returns Property records data
   */
  async getPropertyRecords(prospect: any): Promise<any> {
    // In a real implementation, we'd connect to MLS or property data APIs
    // For now, return placeholder data based on prospect info
    return {
      recentListings: [
        `${Math.floor(Math.random() * 1000)} Main St, Anytown`,
        `${Math.floor(Math.random() * 1000)} Oak Ave, Somewhere`
      ],
      recentSales: [
        `${Math.floor(Math.random() * 1000)} Pine Rd, Elsewhere`,
        `${Math.floor(Math.random() * 1000)} Elm St, Whatever`
      ],
      averageSalePrice: Math.floor(Math.random() * 500000) + 200000,
      listingsCount: Math.floor(Math.random() * 20) + 1,
      yearlyTransactionVolume: Math.floor(Math.random() * 50) + 5,
      averageDaysOnMarket: Math.floor(Math.random() * 60) + 15,
      priceReductionFrequency: Math.floor(Math.random() * 10)
    };
  },

  /**
   * Get team information from website or social media
   * @param prospect The prospect to get team info for
   * @returns Team information
   */
  async getTeamInfo(prospect: any): Promise<any> {
    // Placeholder implementation
    return {
      teamSize: Math.floor(Math.random() * 5) + 1,
      recentHires: [],
      recentDepartures: [],
      officeLocations: [prospect.company || 'Unknown Location']
    };
  },

  /**
   * Get certifications and designations
   * @param prospect The prospect to get certifications for
   * @returns Certification data
   */
  async getCertifications(prospect: any): Promise<any> {
    // Placeholder implementation
    const possibleCerts = ['CRS', 'GRI', 'ABR', 'SRS', 'e-PRO', 'AHWD', 'CDPE'];
    const numCerts = Math.floor(Math.random() * 4);
    const certs = [];
    for (let i = 0; i < numCerts; i++) {
      const randomIndex = Math.floor(Math.random() * possibleCerts.length);
      certs.push(possibleCerts.splice(randomIndex, 1)[0]);
    }

    return {
      certifications: certs,
      designations: certs.filter(c => ['CRS', 'GRI', 'ABR', 'SRS'].includes(c))
    };
  },

  /**
   * Search for news mentions
   * @param query Search query
   * @returns News data
   */
  async searchNews(query: string): Promise<any> {
    // Placeholder implementation
    return {
      articles: [
        {
          title: `Local agent ${query.split(' ')[0]} makes top 10 list`,
          source: 'Local News',
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          url: '#'
        }
      ],
      awards: Math.random() > 0.7 ? ['Top Producer 2023', 'Customer Service Excellence'] : [],
      events: Math.random() > 0.5 ? ['Local Real Estate Conference', 'Charity Event'] : []
    };
  },

  /**
   * Analyze content for pain point indicators
   * @param prospect The prospect to analyze
   * @returns Pain point indicators
   */
  async analyzeContentForPainPoints(prospect: any): Promise<any> {
    // Placeholder implementation - would analyze actual content in reality
    return {
      leadGenerationChallenges: Math.random() > 0.3,
      technologyComplaints: Math.random() > 0.5,
      administrativeBurden: Math.random() > 0.4,
      marketingEffectivenessConcerns: Math.random() > 0.6,
      clientCommunicationIssues: Math.random() > 0.5,
      followUpSystemGaps: Math.random() > 0.4
    };
  },

  /**
   * Get reviews and testimonials
   * @param prospect The prospect to get reviews for
   * @returns Reviews data
   */
  async getReviews(prospect: any): Promise<any> {
    // Placeholder implementation
    return {
      averageRating: Math.random() * 2 + 3, // 3-5 stars
      reviewCount: Math.floor(Math.random() * 50),
      commonComplaints: Math.random() > 0.5 ? ['Slow response time', 'Hard to reach'] : [],
      commonPraises: Math.random() > 0.5 ? ['Knowledgeable', 'Great communicator'] : []
    };
  },

  /**
   * Analyze technology gaps compared to local market
   * @param prospect The prospect to analyze
   * @returns Technology gap analysis
   */
  async analyzeTechGaps(prospect: any): Promise<any> {
    // Placeholder implementation
    const possibleGaps = ['No IDX integration', 'Poor mobile experience', 'No lead nurturing',
                         'Outdated CRM', 'No automated follow-up', 'Poor SEO'];
    const numGaps = Math.floor(Math.random() * 4);
    const gaps = [];
    for (let i = 0; i < numGaps; i++) {
      const randomIndex = Math.floor(Math.random() * possibleGaps.length);
      gaps.push(possibleGaps.splice(randomIndex, 1)[0]);
    }

    return {
      gaps,
      marketingTechGap: Math.random() > 0.3,
      crmGap: Math.random() > 0.4,
      leadNurturingGap: Math.random() > 0.5
    };
  },

  // Helper methods

  /**
   * Estimate traffic from site characteristics (very rough)
   * @param $ Cheerio instance
   * @param html HTML content
   * @returns Estimated monthly traffic
   */
  estimateTrafficFromRank($: any, html: string): number {
    // Very rough estimation based on site size and external links
    const externalLinks = $('a[href^="http"]').filter((_, el) => {
      const href = $(el).attr('href') || '';
      return !href.includes($('base').attr('href') || '') && href.length > 0;
    }).length;

    // Base traffic on external links (more links = potentially more traffic)
    let baseTraffic = Math.min(externalLinks * 100, 5000);

    // Adjust for content richness
    const wordCount = $('body').text().trim().split(/\s+/).length;
    baseTraffic += Math.min(wordCount / 10, 1000);

    // Add some randomness
    return Math.max(0, baseTraffic + (Math.random() - 0.5) * 1000);
  },

  /**
   * Estimate domain age from hostname
   * @param hostname Domain hostname
   * @returns Estimated age in years
   */
  estimateDomainAge(hostname: string): number {
    // Very rough estimation - in reality would use WHOIS
    // Older domains tend to have certain TLDs or patterns
    const tld = hostname.split('.').pop();
    let baseAge = 5; // Default assumption

    // Adjust by TLD (older TLDs = potentially older domains)
    switch (tld) {
      case 'com':
      case 'org':
      case 'net':
        baseAge = 7;
        break;
      case 'us':
      case 'uk':
      case 'ca':
        baseAge = 10;
        break;
      default:
        baseAge = 3;
        break;
    }

    // Add randomness
    return Math.max(0, baseAge + (Math.random() - 0.5) * 8);
  },

  /**
   * Check if site appears mobile-friendly
   * @param $ Cheerio instance
   * @returns Boolean indicating mobile-friendliness
   */
  checkMobileFriendly($: any): boolean {
    // Check for viewport meta tag
    const viewport = $('meta[name="viewport"]').attr('content');
    if (viewport && viewport.includes('width=device-width')) {
      return true;
    }

    // Check for responsive CSS indicators
    const hasMediaQuery = $('style').text().includes('@media') ||
                         $('link[rel="stylesheet"]').toArray().some((el: any) =>
                           $(el).attr('href') && $(el).attr('href').includes('responsive'));
    if (hasMediaQuery) {
      return true;
    }

    // Check for common mobile frameworks
    const html = $('html').attr('class') || '';
    return html.includes('mobile') || html.includes('responsive');
  }
};