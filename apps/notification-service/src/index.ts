import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import notificationRoutes from './routes/notification.routes';
import { startNotificationWorkers } from './workers/notification.worker';
import { config } from './config';
import { logger } from '@traintravel/logger';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'notification-service', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  startNotificationWorkers();
  app.listen(config.port, () => {
    logger.info(`✉️ Notification Service (Resend Email & Twilio SMS) listening on port ${config.port}`);
  });
}

export default app;
