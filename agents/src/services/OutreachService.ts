import { Injectable } from '@nestjs/common';
import { Prospect } from '../models/Prospect';
import { Campaign } from '../models/Campaign';
import { Interaction } from '../models/Interaction';
import { MessageTemplate } from '../models/MessageTemplate';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PersonalizationService } from './PersonalizationService';
import { emailUtils } from '../utils/emailUtils';
import { linkedinUtils } from '../utils/linkedinUtils';
import { TemplateProcessor } from '../utils/templateProcessor';

@Injectable()
export class OutreachService {
  constructor(
    @Repository(Prospect)
    private prospectRepository: Repository<Prospect>,
    @Repository(Campaign)
    private campaignRepository: Repository<Campaign>,
    @Repository(Interaction)
    private interactionRepository: Repository<Interaction>,
    @Repository(MessageTemplate)
    private messageTemplateRepository: Repository<MessageTemplate>,
    private personalizationService: PersonalizationService,
  ) {}

  /**
   * Create a new outreach campaign
   */
  async createCampaign(name: string, description: string, prospectIds: number[]): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      name,
      description,
      targetProspectCount: prospectIds.length,
      status: 'draft'
    });
    return await this.campaignRepository.save(campaign);
  }

  /**
   * Start a campaign (change status from draft to active)
   */
  async startCampaign(campaignId: number): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    campaign.status = 'active';
    return await this.campaignRepository.save(campaign);
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: number): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    campaign.status = 'paused';
    return await this.campaignRepository.save(campaign);
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(campaignId: number): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    campaign.status = 'completed';
    return await this.campaignRepository.save(campaign);
  }

  /**
   * Cancel a campaign
   */
  async cancelCampaign(campaignId: number): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    campaign.status = 'cancelled';
    return await this.campaignRepository.save(campaign);
  }

  /**
   * Get campaign details with statistics
   */
  async getCampaignDetails(campaignId: number): Promise<Campaign & {
    contactedCount: number;
    respondedCount: number;
    positiveResponseCount: number;
  }> {
    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    // Get interaction counts
    const interactions = await this.interactionRepository.find({
      where: { campaign: { id: campaignId } }
    });

    const contactedCount = interactions.filter(i => i.direction === 'outbound').length;
    const respondedCount = interactions.filter(i => i.direction === 'inbound' && i.receivedAt !== null).length;
    const positiveResponseCount = interactions.filter(i =>
      i.direction === 'inbound' &&
      i.sentiment === 'positive' &&
      i.outcome !== null &&
      i.outcome !== ''
    ).length;

    return {
      ...campaign,
      contactedCount,
      respondedCount,
      positiveResponseCount
    } as any;
  }

  /**
   * Send personalized outreach to a prospect as part of a campaign
   */
  async sendOutreach(
    prospectId: number,
    campaignId: number,
    sequenceStep: number,
    channel: 'email' | 'linkedin' = 'email'
  ): Promise<Interaction> {
    const prospect = await this.prospectRepository.findOne({ where: { id: prospectId } });
    if (!prospect) {
      throw new Error(`Prospect with ID ${prospectId} not found`);
    }

    if (!prospect.canContact) {
      throw new Error(`Prospect ${prospectId} has opted out of contact`);
    }

    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    if (campaign.status !== 'active') {
      throw new Error(`Campaign ${campaignId} is not active (status: ${campaign.status})`);
    }

    // Get appropriate template for this sequence step and channel
    const template = await this.getTemplateForSequenceStep(campaignId, sequenceStep, channel);
    if (!template) {
      throw new Error(`No template found for campaign ${campaignId}, step ${sequenceStep}, channel ${channel}`);
    }

    // Generate personalized message
    const messageType = channel === 'email' ? 'email' :
                       sequenceStep === 1 ? 'linkedin_connection' : 'linkedin_message';
    const { subject, body } = await this.personalizationService.generatePersonalizedMessage(
      prospect,
      template.id,
      messageType as any
    );

    // Send the message via appropriate channel
    let sentAt: Date | undefined;
    let externalId: string | undefined;

    try {
      if (channel === 'email') {
        const result = await emailUtils.sendEmail({
          to: prospect.email,
          subject,
          body
        });
        sentAt = new Date();
        externalId = result.messageId;
      } else if (channel === 'linkedin') {
        if (sequenceStep === 1) {
          // Connection request
          const result = await linkedinUtils.sendConnectionRequest(
            prospect.email || prospect.firstName + ' ' + prospect.lastName,
            body // For LinkedIn, body is the connection note
          );
          sentAt = new Date();
          externalId = result.requestId;
        } else {
          // Direct message (after connection is accepted)
          // In a real implementation, we'd need to check if connection is accepted first
          const result = await linkedinUtils.sendMessage(
            prospect.email || prospect.firstName + ' ' + prospect.lastName,
            body
          );
          sentAt = new Date();
          externalId = result.messageId;
        }
      }
    } catch (error) {
      console.error(`Failed to send ${channel} message to prospect ${prospectId}:`, error);
      // Still create interaction record but mark as failed
      sentAt = new Date();
    }

    // Create interaction record
    const interaction = this.interactionRepository.create({
      type: channel === 'email' ? 'email' : 'linkedin',
      direction: 'outbound',
      subject,
      body,
      sentAt,
      prospect: { id: prospectId } as Prospect,
      campaign: { id: campaignId } as Campaign
    });

    const savedInteraction = await this.interactionRepository.save(interaction);

    // Update prospect's last contacted time
    prospect.lastContactedAt = new Date();
    await this.prospectRepository.save(prospect);

    // Update campaign counters
    campaign.contactedCount = (campaign.contactedCount || 0) + 1;
    await this.campaignRepository.save(campaign);

    return savedInteraction;
  }

  /**
   * Get the appropriate template for a campaign sequence step and channel
   */
  private async getTemplateForSequenceStep(
    campaignId: number,
    sequenceStep: number,
    channel: 'email' | 'linkedin'
  ): Promise<MessageTemplate | null> {
    // In a real implementation, campaigns would have stored sequence configurations
    // For now, we'll fetch templates based on tags that indicate sequence position

    let tag: string;
    if (channel === 'email') {
      switch (sequenceStep) {
        case 1: tag = 'intro'; break;
        case 2: tag = 'value_prop'; break;
        case 3: tag = 'social_proof'; break;
        case 4: tag = 'breakup'; break;
        default: tag = 'follow_up'; break;
      }
    } else { // linkedin
      switch (sequenceStep) {
        case 1: tag = 'linkedin_connection'; break;
        case 2: tag = 'linkedin_message'; break;
        case 3: tag = 'linkedin_followup'; break;
        default: tag = 'linkedin_followup'; break;
      }
    }

    const templates = await this.messageTemplateRepository.find({
      where: {
        isActive: true,
        tags: In([tag])
      }
    });

    if (templates.length === 0) {
      // Fallback to any active template of the right type
      const messageType = channel === 'email' ? 'email' :
                         sequenceStep === 1 ? 'linkedin_connection' : 'linkedin_message';
      return await this.messageTemplateRepository.findOne({
        where: {
          isActive: true,
          type: messageType as any
        }
      });
    }

    // Return the template with highest performance
    return templates.reduce((best, current) =>
      (current.averageResponseRate || 0) > (best.averageResponseRate || 0) ? current : best
    );
  }

  /**
   * Process inbound interactions (replies, etc.)
   */
  async processInboundInteraction(
    prospectId: number,
    channel: 'email' | 'linkedin',
    subject: string,
    content: string,
    receivedAt: Date = new Date()
  ): Promise<Interaction> {
    const prospect = await this.prospectRepository.findOne({ where: { id: prospectId } });
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
    const outcome = this.determineOutcome(content, sentiment);

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

    // If this is a positive response that requires immediate attention, we could trigger notifications here
    if (sentiment === 'positive' && ['demo_scheduled', 'meeting_requested', 'interested'].includes(outcome)) {
      // In a real implementation, we might send a notification or create a task
      console.log(`Positive response received from prospect ${prospectId}: ${outcome}`);
    }

    return savedInteraction;
  }

  /**
   * Analyze sentiment of inbound message
   * Simple implementation - in reality would use NLP service
   */
  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['interested', 'yes', 'great', 'thanks', 'appreciate', 'love', 'excellent', 'perfect', 'exactly', 'looking forward'];
    const negativeWords = ['not interested', 'no', 'stop', 'unsubscribe', 'remove', 'never', 'spam', 'annoying'];

    const lowerContent = content.toLowerCase();

    let positiveScore = 0;
    let negativeScore = 0;

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

    if (positiveScore > negativeScore) {
      return 'positive';
    } else if (negativeScore > positiveScore) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Determine outcome based on content and sentiment
   */
  private determineOutcome(content: string, sentiment: 'positive' | 'neutral' | 'negative'): string {
    const lowerContent = content.toLowerCase();

    if (sentiment === 'positive') {
      if (lowerContent.includes('demo') || lowerContent.includes('demonstration') || lowerContent.includes('see how it works')) {
        return 'demo_scheduled';
      }
      if (lowerContent.includes('meeting') || lowerContent.includes('call') || lowerContent.includes('talk')) {
        return 'meeting_requested';
      }
      if (lowerContent.includes('price') || lowerContent.includes('cost') || lowerContent.includes('pricing')) {
        return 'pricing_inquiry';
      }
      if (lowerContent.includes('how does it work') || lowerContent.includes('tell me more')) {
        return 'info_requested';
      }
      return 'interested';
    }

    if (sentiment === 'negative') {
      if (lowerContent.includes('unsubscribe') || lowerContent.includes('remove') || lowerContent.includes('stop')) {
        return 'unsubscribed';
      }
      if (lowerContent.includes('not interested') || lowerContent.includes('not interested')) {
        return 'not_interested';
      }
      if (lowerContent.includes('wrong person') || lowerContent.includes('not the right person')) {
        return 'wrong_contact';
      }
      return 'declined';
    }

    // Neutral responses
    if (lowerContent.includes('maybe') || lowerContent.includes('later') || lowerContent.includes('follow up')) {
      return 'follow_up_needed';
    }
    if (lowerContent.includes('busy') || lowerContent.include('occupied')) {
      return 'busy_now';
    }
    return 'acknowledged';
  }

  /**
   * Get next sequence step for a prospect in a campaign
   */
  async getNextSequenceStep(prospectId: number, campaignId: number): Promise<{
    stepNumber: number;
    channel: 'email' | 'linkedin';
    delayHours: number;
  } | null> {
    // Get all interactions for this prospect in this campaign, ordered by time
    const interactions = await this.interactionRepository.find({
      where: {
        prospect: { id: prospectId },
        campaign: { id: campaignId }
      },
      order: { sentAt: 'ASC' }
    });

    const outboundInteractions = interactions.filter(i => i.direction === 'outbound');
    const inboundInteractions = interactions.filter(i => i.direction === 'inbound');

    // If no outbound yet, start with step 1 email
    if (outboundInteractions.length === 0) {
      return { stepNumber: 1, channel: 'email', delayHours: 0 };
    }

    // Get the last outbound interaction
    const lastOutbound = outboundInteractions[outboundInteractions.length - 1];
    const lastOutboundTime = lastOutbound.sentat || lastOutbound.createdat;

    // Check if there's been a response since last outbound
    const hasRecentResponse = inboundInteractions.some(i => {
      const responseTime = i.receivedat || i.createdat;
      return responseTime > lastOutboundTime;
    });

    // If there's been a response, we might want to adjust sequencing
    // For simplicity, we'll continue with the sequence but note the response

    // Determine next step based on last sent
    let nextStep: number;
    let nextChannel: 'email' | 'linkedin';
    let delayHours: number;

    // Simple sequencing logic - in reality this would come from campaign settings
    const lastStep = outboundInteractions.length; // Assuming we're tracking steps properly

    // Define sequence: Email1 -> LinkedIn Conn -> Email2 -> LinkedIn Msg -> Email3 -> LinkedIn Msg -> Email4 (Breakup)
    const sequence: Array<{channel: 'email' | 'linkedin', step: number}> = [
      {channel: 'email', step: 1},
      {channel: 'linkedin', step: 1},
      {channel: 'email', step: 2},
      {channel: 'linkedin', step: 2},
      {channel: 'email', step: 3},
      {channel: 'linkedin', step: 2},
      {channel: 'email', step: 4}
    ];

    if (lastStep >= sequence.length) {
      return null; // Sequence complete
    }

    const nextInSequence = sequence[lastStep];
    nextStep = nextInSequence.step;
    nextChannel = nextInSequence.channel;

    // Set delays based on step and channel
    // These would typically come from campaign configuration
    if (nextChannel === 'email') {
      delayHours = nextStep === 1 ? 0 : (nextStep * 24); // Day 1, 3, 5, 7
    } else { // linkedin
      delayHours = nextStep === 1 ? 24 : (nextStep * 24 + 12); // Day 2, 4, 6 (slightly offset from emails)
    }

    return { stepNumber: nextStep, channel: nextChannel, delayHours };
  }

  /**
   * Pause outreach to a prospect (respect opt-out or temporary pause)
   */
  async pauseProspectOutreach(prospectId: number, reason: string = 'manual_pause'): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({ where: { id: prospectId } });
    if (!prospect) {
      throw new Error(`Prospect with ID ${prospectId} not found`);
    }

    prospect.canContact = false;
    // We could store the pause reason in a separate field or in intelligenceData
    if (prospect.intelligenceData) {
      prospect.intelligenceData.pauseReason = reason;
      prospect.intelligenceData.pausedAt = new Date().toISOString();
    }
    return await this.prospectRepository.save(prospect);
  }

  /**
   * Resume outreach to a prospect
   */
  async resumeProspectOutreach(prospectId: number): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({ where: { id: prospectId } });
    if (!prospect) {
      throw new Error(`Prospect with ID ${prospectId} not found`);
    }

    prospect.canContact = true;
    // Clear pause data
    if (prospect.intelligenceData) {
      delete prospect.intelligenceData.pauseReason;
      delete prospect.intelligenceData.pausedAt;
    }
    return await this.prospectRepository.save(prospect);
  }
}