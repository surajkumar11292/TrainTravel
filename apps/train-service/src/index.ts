import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import trainRoutes from './routes/train.routes';
import { config } from './config';
import { logger } from '@traintravel/logger';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', trainRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'train-service', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    logger.info(`🚆 Train & Schedule Service listening on port ${config.port}`);
  });
}

export default app;
