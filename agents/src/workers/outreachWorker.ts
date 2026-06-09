import { Queue, Worker } from 'bull';
import { OutreachService } from '../services/OutreachService';
import { Logger } from '@nestjs/common';

/**
 * Worker for sending outreach messages (email, LinkedIn)
 */
export class OutreachWorker {
  private outreachService: OutreachService;
  private logger: Logger;
  private worker: Worker;

  constructor(outreachService: OutreachService, private queue: Queue) {
    this.outreachService = outreachService;
    this.logger = new Logger(OutreachWorker.name);

    // Set up the worker
    this.worker = this.worker = new Worker(queue.name, this.processJob.bind(this), {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.setupEventHandlers();
  }

  private async processJob(job: any) {
    try {
      this.logger.log(`Processing outreach job ${job.id}: ${JSON.stringify(job.data)}`);

      const { prospectId, campaignId, sequenceStep, channel } = job.data;

      // Send the outreach message
      const interaction = await this.outreachService.sendOutreach(
        prospectId,
        campaignId,
        sequenceStep,
        channel
      );

      this.logger.log(`Sent ${channel} outreach to prospect ${prospectId} (step ${sequenceStep})`);

      // After sending, we might want to schedule the next step in the sequence
      // This would typically check if there's been a response and determine timing
      const nextStep = await this.outreachService.getNextSequenceStep(prospectId, campaignId);
      if (nextStep) {
        // Schedule next step with appropriate delay
        await this.queue.add('outreach', {
          prospectId,
          campaignId,
          sequenceStep: nextStep.stepNumber,
          channel: nextStep.channel
        }, {
          delay: nextStep.delayHours * 60 * 60 * 1000 // Convert hours to milliseconds
        });
      }

      return { interactionId: interaction.id };
    } catch (error) {
      this.logger.error(`Error processing outreach job ${job.id}:`, error);
      throw error;
    }
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job: any) => {
      this.logger.log(`Outreach job ${job.id} completed`);
    });

    this.worker.on('failed', (job: any, error: any) => {
      this.logger.error(`Outreach job ${job.id} failed:`, error);
    });

    this.worker.on('error', (error: any) => {
      this.logger.error('Outreach worker error:', error);
    });
  }

  /**
   * Add an outreach job to the queue
   */
  static async addJob(queue: Queue, prospectId: number, campaignId: number, sequenceStep: number, channel: 'email' | 'linkedin') {
    return await queue.add('outreach', { prospectId, campaignId, sequenceStep, channel }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
  }

  /**
   * Close the worker and queue connections
   */
  async close() {
    await this.worker.close();
    await this.queue.close();
  }
}