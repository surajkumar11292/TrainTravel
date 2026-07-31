import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '@traintravel/logger';

const host = process.env.REDIS_HOST || 'localhost';
const port = parseInt(process.env.REDIS_PORT || '6379', 10);
const password = process.env.REDIS_PASSWORD || undefined;

export const redisConnection = new Redis({
  host,
  port,
  password,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
});

export const QUEUE_NAMES = {
  BOOKING_EXPIRATION: 'booking-expiration-queue',
  TATKAL_WAITING_ROOM: 'tatkal-waiting-room-queue',
} as const;

export function createQueue(queueName: string) {
  return new Queue(queueName, { connection: redisConnection as any });
}

export function createWorker(queueName: string, processor: (job: any) => Promise<any>) {
  const worker = new Worker(queueName, processor, { connection: redisConnection as any });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} in ${queueName} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} in ${queueName} failed:`, err);
  });

  return worker;
}
