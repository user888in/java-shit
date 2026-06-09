import { Queue } from 'bull';

/**
 * Setup queues for background processing
 */
export const queues = {
  prospecting: new Queue('prospecting', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    }
  }),

  research: new Queue('research', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    }
  }),

  outreach: new Queue('outreach', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    }
  }),

  outreach_prep: new Queue('outreach_prep', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    }
  })
};

/**
 * Initialize workers
 * Note: In a real implementation, you'd want to manage worker lifecycle properly
 */
export async function initializeWorkers(
  prospectService: any,
  intelligenceService: any,
  outreachService: any
) {
  // Import workers here to avoid circular dependencies
  const { ProspectingWorker } = await import('./workers/prospectingWorker');
  const { ResearchWorker } = await import('./workers/researchWorker');
  const { OutreachWorker } = await import('./workers/outreachWorker');

  // Create workers
  const prospectingWorker = new ProspectingWorker(prospectService, queues.prospecting);
  const researchWorker = new ResearchWorker(intelligenceService, queues.research);
  const outreachWorker = new OutreachWorker(outreachService, queues.outreach);

  return { prospectingWorker, researchWorker, outreachWorker };
}

// Graceful shutdown
export async function shutdownWorkers(workers: any[]) {
  for (const worker of workers) {
    if (worker) {
      await worker.close();
    }
  }

  // Close all queues
  for (const queueName in queues) {
    await queues[queueName].close();
  }
}