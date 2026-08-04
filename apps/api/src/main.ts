import express from 'express';
import cors from 'cors';
import { env } from './shared/config/env.js';
import { errorMiddleware } from './gateway/middleware/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Centralized error handling middleware
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`🚀 API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

export { app };
