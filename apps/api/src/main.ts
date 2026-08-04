import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { env } from './shared/config/env.js';
import { errorMiddleware } from './gateway/middleware/error.middleware.js';
import { gatewayRouter } from './gateway/router.js';
import { configureGoogleStrategy } from './domains/auth/google-oauth.service.js';
import { registerUsersEventListeners } from './domains/users/users.events.js';

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

configureGoogleStrategy();
registerUsersEventListeners();

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount domain routes
app.use(gatewayRouter);

// Centralized error handling middleware
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`🚀 API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

export { app };
