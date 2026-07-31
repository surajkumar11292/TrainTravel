import { Router } from 'express';
import proxy from 'express-http-proxy';
import { config } from '../config';
import { createRateLimiter } from '../middleware/rate-limiter';
import { botProtectionGuard } from '../middleware/bot-protection';
import { waitingRoomGuard } from '../middleware/waiting-room';
import waitingRoomRoutes from './waiting-room.routes';

const router: Router = Router();

// Strict action-specific rate limits
const authRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'auth' });
const searchRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'search' });
const bookingRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 5, keyPrefix: 'booking' });

// Virtual Waiting Room endpoints
router.use('/waiting-room', waitingRoomRoutes);

// Route proxies with security guards
router.use('/auth', authRateLimiter, botProtectionGuard, proxy(config.services.auth));
router.use('/users', proxy(config.services.user));
router.use('/search', searchRateLimiter, proxy(config.services.search));
router.use('/trains', proxy(config.services.train));
router.use('/bookings', bookingRateLimiter, botProtectionGuard, proxy(config.services.booking));
router.use('/seats', botProtectionGuard, proxy(config.services.seat));
router.use('/payments', botProtectionGuard, proxy(config.services.payment));
router.use('/tracking', proxy(config.services.tracking));
router.use('/notifications', proxy(config.services.notification));

export default router;
