import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import seatRoutes from './routes/seat.routes';
import { config } from './config';
import { logger } from '@traintravel/logger';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/seats', seatRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'seat-service', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    logger.info(`💺 Seat Inventory Service listening on port ${config.port}`);
  });
}

export default app;
