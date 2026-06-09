import { Injectable } from '@nestjs/common';
import { Prospect } from '../models/Prospect';
import { Interaction } from '../models/Interaction';
import { Campaign } from '../models/Campaign';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalizationService } from './PersonalizationService';
import { OutreachService } from './OutreachService';

@Injectable()
export class ResponseService {
  constructor(
    @Repository(Prospect)
    private prospectRepository: Repository<Prospect>,
    @Repository(Interaction)
    private interactionRepository: Repository<Interaction>,
    @Repository(Campaign)
    private campaignRepository: Repository<Campaign>,
    private personalizationService: PersonalizationService,
    private outreachService: OutreachService,
  ) {}

  /**
   * Process an inbound interaction (reply, message, etc.)
   * This is the main entry point for handling responses
   */
  async processInboundInteraction(
    prospectId: number,
    channel: 'email' | 'linkedin',
    subject: string,
    content: string,
    receivedAt: Date = new Date()
  ): Promise<Interaction> {
    // Find the prospect
    const prospect = await this.prospectRepository.findOne({
      where: { id: prospectId }
    });
    if (!prospect) {
      throw new Error(`Prospect with ID ${prospectId} not found`);
    }

    // Find the most recent outbound interaction to associate this with
    const recentOutbound = await this.interactionRepository.findOne({
      where: {
        prospect: { id: prospectId },
        direction: 'outbound'
      },
      order: { sentAt: 'DESC' }
    });

    // Analyze sentiment and determine outcome
    const sentiment = this.analyzeSentiment(content);
    const outcome = this.determineOutcome(content, sentiment, prospect);

    // Create interaction record
    const interaction = this.interactionRepository.create({
      type: channel,
      direction: 'inbound',
      subject,
      content: content,
      receivedAt,
      sentiment,
      outcome,
      prospect: { id: prospectId } as Prospect,
      campaign: recentOutbound?.campaign || null
    });

    const savedInteraction = await this.interactionRepository.save(interaction);

    // Learn from this response to improve future personalization
    await this.learnFromResponse(prospect, interaction, sentiment, outcome);

    // Trigger appropriate actions based on the response
    await this.triggerResponseActions(prospect, interaction, sentiment, outcome);

    return savedInteraction;
  }

  /**
   * Analyze sentiment of inbound message
   * Uses a combination of keyword matching and basic NLP
   */
  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = [
      'interested', 'yes', 'great', 'thanks', 'appreciate', 'love', 'excellent',
      'perfect', 'exactly', 'looking forward', 'sounds good', 'tell me more',
      'how does it work', 'demo', 'meeting', 'call', 'talk', 'when can we',
      'available', 'schedule', 'pricing', 'cost', 'invest', 'worth it'
    ];

    const negativeWords = [
      'not interested', 'no', 'stop', 'unsubscribe', 'remove', 'never',
      'spam', 'annoying', 'busy', 'not now', 'maybe later', 'wrong person',
      'not the right person', 'already using', 'current provider', 'contract',
      'too expensive', 'cannot afford', 'budget'
    ];

    const neutralWords = [
      'thanks for reaching out', 'i will review', 'let me think about it',
      'get back to you', 'need to discuss with team', 'check with partner'
    ];

    const lowerContent = content.toLowerCase();

    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    for (const word of positiveWords) {
      if (lowerContent.includes(word)) {
        positiveScore++;
      }
    }

    for (const word of negativeWords) {
      if (lowerContent.includes(word)) {
        negativeScore++;
      }
    }

    for (const word of neutralWords) {
      if (lowerContent.includes(word)) {
        neutralScore++;
      }
    }

    // Determine sentiment based on scores
    if (positiveScore > negativeScore && positiveScore >= neutralScore) {
      return 'positive';
    } else if (negativeScore > positiveScore && negativeScore >= neutralScore) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Determine outcome based on content, sentiment, and prospect context
   */
  private determineOutcome(
    content: string,
    sentiment: 'positive' | 'neutral' | 'negative',
    prospect: Prospect
  ): string {
    const lowerContent = content.toLowerCase();

    if (sentiment === 'positive') {
      // Check for specific positive outcomes
      if (lowerContent.includes('demo') || lowerContent.includes('demonstration') ||
          lowerContent.includes('see how it works') || lowerContent.includes('walkthrough')) {
        return 'demo_scheduled';
      }

      if (lowerContent.includes('meeting') || lowerContent.includes('call') ||
          lowerContent.includes('talk') || lowerContent.includes('schedule') ||
          lowerContent.includes('when can we') || lowerContent.includes('available')) {
        return 'meeting_scheduled';
      }

      if (lowerContent.includes('price') || lowerContent.includes('cost') ||
          lowerContent.includes('pricing') || lowerContent.includes('investment')) {
        return 'pricing_inquiry';
      }

      if (lowerContent.includes('how does it work') ||
          lowerContent.includes('tell me more') ||
          lowerContent.includes('more information') ||
          lowerContent.includes('details') ||
          lowerContent.includes('features')) {
        return 'info_requested';
      }

      if (lowerContent.includes('yes') || lowerContent.includes('sounds good') ||
          lowerContent.includes('interested') || lowerContent.includes('looking forward')) {
        return 'interested';
      }

      return 'positive_response';
    }

    if (sentiment === 'negative') {
      // Check for specific negative outcomes
      if (lowerContent.includes('unsubscribe') || lowerContent.includes('remove') ||
          lowerContent.includes('stop') || lowerContent.includes('opt out')) {
        return 'unsubscribed';
      }

      if (lowerContent.includes('not interested') ||
          lowerContent.includes('not interested') ||
          lowerContent.includes('no thanks')) {
        return 'not_interested';
      }

      if (lowerContent.includes('wrong person') ||
          lowerContent.includes('not the right person') ||
          lowerContent.includes('wrong contact')) {
        return 'wrong_contact';
      }

      if (lowerContent.includes('already using') ||
          lowerContent.includes('current provider') ||
          lowerContent.includes('already have') ||
          lowerContent.includes('under contract')) {
        return 'existing_solution';
      }

      if (lowerContent.includes('too expensive') ||
          lowerContent.includes('cannot afford') ||
          lowerContent.includes('budget') ||
          lowerContent.includes('price')) {
        return 'price_objection';
      }

      if (lowerContent.includes('not now') ||
          lowerContent.includes('busy') ||
          lowerContent.includes('maybe later') ||
          lowerContent.includes('follow up later')) {
        return 'timing_objection';
      }

      return 'declined';
    }

    // Neutral responses
    if (lowerContent.includes('thanks for reaching out') ||
        lowerContent.includes('i will review') ||
        lowerContent.includes('let me think about it') ||
        lowerContent.includes('get back to you') ||
        lowerContent.includes('need to discuss with team') ||
        lowerContent.includes('check with partner')) {
      return 'needs_time_to_evaluate';
    }

    if (lowerContent.includes('busy') ||
        lowerContent.includes('occupied') ||
        lowerContent.includes('traveling')) {
      return 'currently_unavailable';
    }

    return 'acknowledged';
  }

  /**
   * Learn from responses to improve future personalization and targeting
   */
  private async learnFromResponse(
    prospect: Prospect,
    interaction: Interaction,
    sentiment: 'positive' | 'neutral' | 'negative',
    outcome: string
  ): Promise<void> {
    try {
      // Update prospect intelligence based on response
      if (!prospect.intelligenceData) {
        prospect.intelligenceData = {};
      }

      // Track response history
      if (!prospect.intelligenceData.responseHistory) {
        prospect.intelligenceData.responseHistory = [];
      }

      prospect.intelligenceData.responseHistory.push({
        interactionId: interaction.id,
        sentiment,
        outcome,
        timestamp: new Date().toISOString(),
        channel: interaction.type
      });

      // Keep only last 10 responses to prevent unbounded growth
      if (prospect.intelligenceData.responseHistory.length > 10) {
        prospect.intelligenceData.responseHistory =
          prospect.intelligenceData.responseHistory.slice(-10);
      }

      // Update lead scoring based on response
      const leadScoreUpdate = this.calculateLeadScoreUpdate(sentiment, outcome);
      prospect.intelligenceData.leadScore =
        (prospect.intelligenceData.leadScore || 50) + leadScoreUpdate;

      // Bound lead score between 0 and 100
      prospect.intelligenceData.leadScore = Math.max(0, Math.min(100, prospect.intelligenceData.leadScore));

      // Update preferred communication channel based on response
      if (sentiment === 'positive' && interaction.type === 'email') {
        prospect.intelligenceData.preferredChannel = 'email';
      } else if (sentiment === 'positive' && interaction.type === 'linkedin') {
        prospect.intelligenceData.preferredChannel = 'linkedin';
      }

      // Save updated prospect
      await this.prospectRepository.save(prospect);

      // Update template performance metrics if this was a response to outreach
      if (interaction.direction === 'inbound' &&
          interaction.prospect &&
          interaction.campaign) {
        await this.updateTemplatePerformance(prospect, interaction, sentiment, outcome);
      }

    } catch (error) {
      console.error(`Error learning from response for prospect ${prospect.id}:`, error);
      // Don't fail the response processing if learning fails
    }
  }

  /**
   * Calculate how much to adjust lead score based on response
   */
  private calculateLeadScoreUpdate(
    sentiment: 'positive' | 'neutral' | 'negative',
    outcome: string
  ): number {
    // Base scores by sentiment
    let scoreChange = 0;

    switch (sentiment) {
      case 'positive':
        scoreChange = 15;
        break;
      case 'neutral':
        scoreChange = 0;
        break;
      case 'negative':
        scoreChange = -10;
        break;
    }

    // Adjust based on specific outcomes
    switch (outcome) {
      case 'demo_scheduled':
      case 'meeting_scheduled':
        scoreChange += 25;
        break;
      case 'pricing_inquiry':
        scoreChange += 20;
        break;
      case 'info_requested':
        scoreChange += 10;
        break;
      case 'interested':
        scoreChange += 5;
        break;
      case 'unsubscribed':
        scoreChange -= 30;
        break;
      case 'not_interested':
        scoreChange -= 15;
        break;
      case 'wrong_contact':
        scoreChange -= 5;
        break;
      case 'existing_solution':
        scoreChange -= 10;
        break;
      case 'price_objection':
        scoreChange -= 15;
        break;
      case 'timing_objection':
        scoreChange -= 5;
        break;
      default:
        // No change for other outcomes
        break;
    }

    return scoreChange;
  }

  /**
   * Update template performance metrics based on response
   */
  private async updateTemplatePerformance(
    prospect: Prospect,
    interaction: Interaction,
    sentiment: 'positive' | 'neutral' | 'negative',
    outcome: string
  ): Promise<void> {
    try {
      // We would need to know which template was used for the outbound message
      // This would typically be stored in the interaction or we'd need to look it up
      // For simplicity, we'll skip this implementation for now
      // In a real implementation, we'd:
      // 1. Find the outbound interaction that prompted this response
      // 2. Determine which template was used for that outbound message
      // 3. Update that template's performance metrics

      console.log(`Would update template performance for prospect ${prospect.id} based on response`);
    } catch (error) {
      console.error(`Error updating template performance:`, error);
    }
  }

  /**
   * Trigger appropriate actions based on response type
   */
  private async triggerResponseActions(
    prospect: Prospect,
    interaction: Interaction,
    sentiment: 'positive' | 'neutral' | 'negative',
    outcome: string
  ): Promise<void> {
    try {
      // Handle positive responses that need immediate attention
      if (sentiment === 'positive' &&
          ['demo_scheduled', 'meeting_scheduled', 'pricing_inquiry', 'info_requested'].includes(outcome)) {

        // In a real implementation, we might:
        // 1. Send a notification to sales team
        // 2. Create a task in CRM
        // 3. Schedule automated follow-up
        // 4. Update prospect status

        console.log(`Positive response requiring attention from prospect ${prospect.id}: ${outcome}`);

        // Example: If it's a demo request, we might want to prioritize follow-up
        if (outcome === 'demo_scheduled' || outcome === 'meeting_scheduled') {
          // Update prospect to high priority
          if (!prospect.intelligenceData) {
            prospect.intelligenceData = {};
          }
          prospect.intelligenceData.priority = 'high';
          prospect.intelligenceData.followUpNeeded = true;
          await this.prospectRepository.save(prospect);
        }
      }

      // Handle negative responses that should stop outreach
      if (sentiment === 'negative' &&
          ['unsubscribed', 'not_interested', 'wrong_contact', 'existing_solution'].includes(outcome)) {

        // Stop outreach to this prospect
        if (outcome === 'unsubscribed' || outcome === 'not_interested') {
          await this.outreachService.pauseProspectOutreach(prospect.id, outcome);
        }

        // If wrong contact, we might want to try to find the right person
        if (outcome === 'wrong_contact') {
          // In a real implementation, we might search for correct contact
          console.log(`Wrong contact for prospect ${prospect.id}, would search for correct contact`);
        }
      }

      // Handle timing objections - schedule follow-up
      if (outcome === 'timing_objection') {
        if (!prospect.intelligenceData) {
          prospect.intelligenceData = {};
        }
        prospect.intelligenceData.followUpNeeded = true;
        prospect.intelligenceData.followUpAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
        await this.prospectRepository.save(prospect);
      }

    } catch (error) {
      console.error(`Error triggering response actions for prospect ${prospect.id}:`, error);
    }
  }

  /**
   * Get response analytics for a prospect
   */
  async getResponseAnalytics(prospectId: number): Promise<{
    totalResponses: number;
    positiveResponses: number;
    negativeResponses: number;
    neutralResponses: number;
    latestResponse: {
      sentiment: string;
      outcome: string;
      timestamp: string;
    } | null;
    leadScore: number;
    preferredChannel: 'email' | 'linkedin' | null;
  }> {
    const prospect = await this.prospectRepository.findOne({
      where: { id: prospectId }
    });

    if (!prospect) {
      throw new Error(`Prospect with ID ${prospectId} not found`);
    }

    const responses = prospect.intelligenceData?.responseHistory || [];
    const totalResponses = responses.length;

    const positiveResponses = responses.filter(r => r.sentiment === 'positive').length;
    const negativeResponses = responses.filter(r => r.sentiment === 'negative').length;
    const neutralResponses = responses.filter(r => r.sentiment === 'neutral').length;

    const latestResponse = responses.length > 0
      ? {
          sentiment: responses[responses.length - 1].sentiment,
          outcome: responses[responses.length - 1].outcome,
          timestamp: responses[responses.length - 1].timestamp
        }
      : null;

    return {
      totalResponses,
      positiveResponses,
      negativeResponses,
      neutralResponses,
      latestResponse,
      leadScore: prospect.intelligenceData?.leadScore || 50,
      preferredChannel: prospect.intelligenceData?.preferredChannel || null
    };
  }

  /**
   * Get response analytics for a campaign
   */
  async getCampaignResponseAnalytics(campaignId: number): Promise<{
    totalInteractions: number;
    outboundInteractions: number;
    inboundInteractions: number;
    responseRate: number;
    positiveResponseRate: number;
    avgResponseTimeHours: number;
    outcomes: Record<string, number>;
    sentiments: Record<string, number>;
  }> {
    const interactions = await this.interactionRepository.find({
      where: { campaign: { id: campaignId } }
    });

    const totalInteractions = interactions.length;
    const outboundInteractions = interactions.filter(i => i.direction === 'outbound').length;
    const inboundInteractions = interactions.filter(i => i.direction === 'inbound').length;

    const responseRate = outboundInteractions > 0
      ? (inboundInteractions / outboundInteractions) * 100
      : 0;

    const positiveInteractions = interactions.filter(i =>
      i.direction === 'inbound' && i.sentiment === 'positive'
    ).length;

    const positiveResponseRate = inboundInteractions > 0
      ? (positiveInteractions / inboundInteractions) * 100
      : 0;

    // Calculate average response time
    const responseTimes: number[] = [];
    interactions
      .filter(i => i.direction === 'inbound' && i.receivedAt)
      .forEach(inbound => {
        // Find the closest outbound before this inbound
        const priorOutbound = interactions
          .filter(i =>
            i.direction === 'outbound' &&
            i.sentAt &&
            i.sentAt < inbound.receivedAt!)
          .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
          .first();

        if (priorOutbound) {
          const diffMs = inbound.receivedAt.getTime() - priorOutbound.sentAt.getTime();
          responseTimes.push(diffMs / (1000 * 60 * 60)); // Convert to hours
        }
      });

    const avgResponseTimeHours = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0;

    // Count outcomes and sentiments
    const outcomes: Record<string, number> = {};
    const sentiments: Record<string, number> = {};

    interactions.forEach(interaction => {
      if (interaction.outcome) {
        outcomes[interaction.outcome] = (outcomes[interaction.outcome] || 0) + 1;
      }
      if (interaction.sentiment) {
        sentiments[interaction.sentiment] = (sentiments[interaction.sentiment] || 0) + 1;
      }
    });

    return {
      totalInteractions,
      outboundInteractions,
      inboundInteractions,
      responseRate,
      positiveResponseRate,
      avgResponseTimeHours,
      outcomes,
      sentiments
    };
  }
}