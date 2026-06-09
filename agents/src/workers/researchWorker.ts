import { Queue, Worker } from 'bull';
import { IntelligenceService } from '../services/IntelligenceService';
import { Logger } from '@nestjs/common';

/**
 * Worker for gathering intelligence on prospects
 */
export class ResearchWorker {
  private intelligenceService: IntelligenceService;
  private logger: Logger;
  private worker: Worker;

  constructor(intelligenceService: IntelligenceService, private queue: Queue) {
    this.intelligenceService = intelligenceService;
    this.logger = new Logger(ResearchWorker.name);

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
      this.logger.log(`Processing research job ${job.id}: Prospect ID ${job.data.prospectId}`);

      const { prospectId } = job.data;

      // Gather intelligence for the prospect
      const intelligenceData = await this.intelligenceService.gatherIntelligenceById(prospectId);

      this.logger.log(`Completed research for prospect ${prospectId}`);

      // After research is complete, we might want to add to outreach queue
      // or update some scoring/prioritization
      await this.queue.add('outreach_prep', { prospectId }, {
        delay: 2000 // Small delay
      });

      return { prospectId, intelligenceGathered: true };
    } catch (error) {
      this.logger.error(`Error processing research job ${job.id}:`, error);
      throw error;
    }
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job: any) => {
      this.logger.log(`Research job ${job.id} completed`);
    });

    this.worker.on('failed', (job: any, error: any) => {
      this.logger.error(`Research job ${job.id} failed:`, error);
    });

    this.worker.on('error', (error: any) => {
      this.logger.error('Research worker error:', error);
    });
  }

  /**
   * Add a research job to the queue
   */
  static async addJob(queue: Queue, prospectId: number) {
    return await queue.add('research', { prospectId }, {
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