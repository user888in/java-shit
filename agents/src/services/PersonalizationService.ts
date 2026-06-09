import { Injectable } from '@nestjs/common';
import { Prospect } from '../models/Prospect';
import { MessageTemplate } from '../models/MessageTemplate';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { natural } from 'natural';
import { TemplateProcessor } from '../utils/templateProcessor';

@Injectable()
export class PersonalizationService {
  constructor(
    @Repository(MessageTemplate)
    private messageTemplateRepository: Repository<MessageTemplate>,
  ) {}

  /**
   * Generate a personalized message for a prospect
   * @param prospect The prospect to generate message for
   * @param templateId Optional template ID to use (if not provided, will select best matching)
   * @param messageType Type of message: 'email', 'linkedin_connection', 'linkedin_message'
   * @returns Personalized message with subject and body
   */
  async generatePersonalizedMessage(
    prospect: Prospect,
    templateId?: number,
    messageType: 'email' | 'linkedin_connection' | 'linkedin_message' = 'email'
  ): Promise<{ subject: string; body: string; templateId: number }> {
    let template: MessageTemplate;

    if (templateId) {
      template = await this.messageTemplateRepository.findOne({
        where: { id: templateId, isActive: true, type: messageType }
      });
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found or not active`);
      }
    } else {
      // Select best matching template based on prospect data and message type
      template = await this.selectBestTemplate(prospect, messageType);
    }

    // Process the template with prospect data
    const processor = new TemplateProcessor();
    const personalizedSubject = processor.process(template.subject, prospect);
    const personalizedBody = processor.process(template.body, prospect);

    // Update template usage statistics
    await this.updateTemplateUsage(template.id);

    return {
      subject: personalizedSubject,
      body: personalizedBody,
      templateId: template.id
    };
  }

  /**
   * Generate multiple variants of a message for A/B testing
   * @param prospect The prospect to generate messages for
   * @param count Number of variants to generate
   * @param messageType Type of message
   * @returns Array of personalized messages
   */
  async generateMessageVariants(
    prospect: Prospect,
    count: number = 3,
    messageType: 'email' | 'linkedin_connection' | 'linkedin_message' = 'email'
  ): Promise<Array<{ subject: string; body: string; variantId: string; templateId: number }>> {
    const templates = await this.messageTemplateRepository.find({
      where: {
        isActive: true,
        type: messageType
      },
      order: { averageResponseRate: 'DESC' }
    });

    if (templates.length === 0) {
      throw new Error(`No active templates found for message type: ${messageType}`);
    }

    const variants = [];
    const usedTemplates = new Set();

    for (let i = 0; i < count; i++) {
      // Select template (prefer unused ones, then fall back to any)
      let template: MessageTemplate;
      const unusedTemplates = templates.filter(t => !usedTemplates.has(t.id));

      if (unusedTemplates.length > 0) {
        // Select from unused templates, weighted by performance
        template = this.selectWeightedTemplate(unusedTemplates);
      } else {
        // All templates used, select from all
        template = this.selectWeightedTemplate(templates);
      }

      usedTemplates.add(template.id);

      // Process the template
      const processor = new TemplateProcessor();
      const personalizedSubject = processor.process(template.subject, prospect);
      const personalizedBody = processor.process(template.body, prospect);

      variants.push({
        subject: personalizedSubject,
        body: personalizedBody,
        variantId: `${template.id}-variant-${i+1}`,
        templateId: template.id
      });
    }

    return variants;
  }

  /**
   * Select the best template for a prospect based on their data
   */
  private async selectBestTemplate(
    prospect: Prospect,
    messageType: 'email' | 'linkedin_connection' | 'linkedin_message'
  ): Promise<MessageTemplate> {
    const templates = await this.messageTemplateRepository.find({
      where: {
        isActive: true,
        type: messageType
      }
    });

    if (templates.length === 0) {
      throw new Error(`No active templates found for message type: ${messageType}`);
    }

    // Score each template based on relevance to prospect
    const scoredTemplates = templates.map(template => ({
      template,
      score: this.calculateTemplateRelevanceScore(template, prospect)
    }));

    // Sort by score descending and return the best
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates[0].template;
  }

  /**
   * Calculate how relevant a template is to a prospect
   * Higher score means more relevant
   */
  private calculateTemplateRelevanceScore(
    template: MessageTemplate,
    prospect: Prospect
  ): number {
    let score = 0;

    // Base score from historical performance
    score += template.averageResponseRate * 100; // Convert 0-1 rate to 0-100 points

    // Boost score based on tag matching
    const prospectTags = this.extractProspectTags(prospect);
    const templateTags = new Set(template.tags);

    let tagMatches = 0;
    for (const tag of prospectTags) {
      if (templateTags.has(tag)) {
        tagMatches++;
      }
    }

    score += tagMatches * 10; // 10 points per matching tag

    // Boost for usage count (prefer proven templates but not overused)
    if (template.usageCount > 0 && template.usageCount < 100) {
      score += Math.min(template.usageCount, 50) * 0.1; // Up to 5 points for usage
    } else if (template.usageCount >= 100) {
      score -= Math.min((template.usageCount - 100) * 0.1, 20); // Penalty for overuse
    }

    return score;
  }

  /**
   * Extract relevant tags from prospect data for template matching
   */
  private extractProspectTags(prospect: Prospect): string[] {
    const tags = new Set<string>();

    // Add specialization tags
    for (const spec of prospect.specializations) {
      tags.add(spec.toLowerCase());
    }

    // Add experience level tags
    if (prospect.yearlyTransactionVolume > 0) {
      if (prospect.yearlyTransactionVolume < 10) {
        tags.add('new-agent');
      } else if (prospect.yearlyTransactionVolume < 50) {
        tags.add('experienced-agent');
      } else {
        tags.add('top-producer');
      }
    }

    // Add company size tags
    // This would come from intelligence data in a real implementation
    // For now, we'll add some basic tags based on available data

    // Add geographic tags if available in bio or other fields
    if (prospect.bio) {
      const bioLower = prospect.bio.toLowerCase();
      const cities = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix',
                     'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose'];
      for (const city of cities) {
        if (bioLower.includes(city)) {
          tags.add(city.replace(' ', '-'));
        }
      }
    }

    return Array.from(tags);
  }

  /**
   * Select a template using weighted probability based on performance
   */
  private selectWeightedTemplate(templates: MessageTemplate[]): MessageTemplate {
    if (templates.length === 1) {
      return templates[0];
    }

    // Calculate weights based on performance (response rate) and usage
    const weights = templates.map(template => {
      // Base weight from response rate (0-1)
      let weight = template.averageResponseRate * 100;

      // Boost for moderate usage (not too new, not overused)
      if (template.usageCount > 0 && template.usageCount < 50) {
        weight += template.usageCount * 0.5;
      } else if (template.usageCount >= 50) {
        weight += 25 - Math.max(0, (template.usageCount - 50) * 0.1);
      }

      return Math.max(weight, 1); // Ensure minimum weight of 1
    });

    // Calculate total weight
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Select random value
    const random = Math.random() * totalWeight;

    // Find which template this corresponds to
    let cumulativeWeight = 0;
    for (let i = 0; i < templates.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return templates[i];
      }
    }

    // Fallback (shouldn't happen)
    return templates[templates.length - 1];
  }

  /**
   * Update template usage statistics
   */
  private async updateTemplateUsage(templateId: number): Promise<void> {
    const template = await this.messageTemplateRepository.findOne({
      where: { id: templateId }
    });
    if (template) {
      template.usageCount += 1;
      // Note: In a real implementation, we'd update averageResponseRate based on actual results
      await this.messageTemplateRepository.save(template);
    }
  }

  /**
   * Get analytics for a template
   */
  async getTemplateAnalytics(templateId: number): Promise<{
    id: number;
    name: string;
    type: string;
    usageCount: number;
    averageResponseRate: number;
    isActive: boolean;
  }> {
    const template = await this.messageTemplateRepository.findOne({
      where: { id: templateId }
    });
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    return {
      id: template.id,
      name: template.name,
      type: template.type,
      usageCount: template.usageCount,
      averageResponseRate: template.averageResponseRate,
      isActive: template.isActive
    };
  }
}