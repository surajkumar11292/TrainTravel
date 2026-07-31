import { createWorker, QUEUE_NAMES } from '@traintravel/queue';
import { EmailService } from '../services/email.service';
import { SMSService } from '../services/sms.service';
import { logger } from '@traintravel/logger';

export function startNotificationWorkers() {
  // Email Worker
  try {
    createWorker(QUEUE_NAMES.BOOKING_EXPIRATION, async (job) => {
      logger.info(`Processing notification job ${job.id}:`, job.name);
      if (job.name === 'send_email') {
        const { to, subject, html } = job.data;
        await EmailService.sendEmail(to, subject, html);
      } else if (job.name === 'send_sms') {
        const { to, message } = job.data;
        await SMSService.sendSMS(to, message);
      }
    });
    logger.info('🔔 BullMQ Notification Workers started');
  } catch (err: any) {
    logger.warn('BullMQ notification worker fallback (offline mode):', err.message);
  }
}
