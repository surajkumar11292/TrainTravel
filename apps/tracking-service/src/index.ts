import http from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import trackingRoutes from './routes/tracking.routes';
import { TrackingService } from './services/tracking.service';
import { config } from './config';
import { logger } from '@traintravel/logger';

const app: Express = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/tracking', trackingRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'tracking-service', timestamp: new Date().toISOString() });
});

TrackingService.init(io);

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    logger.info(`📡 Real-Time Train Tracking & WebSockets Service listening on port ${config.port}`);
  });
}

export default app;
