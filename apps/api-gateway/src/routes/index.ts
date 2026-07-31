import { Router } from 'express';
import proxy from 'express-http-proxy';
import { config } from '../config';
import { createRateLimiter } from '../middleware/rate-limiter';

const router: Router = Router();

// Strict action-specific rate limits
const authRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'auth' });
const searchRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'search' });
const bookingRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 5, keyPrefix: 'booking' });

// Route proxies
router.use('/auth', authRateLimiter, proxy(config.services.auth));
router.use('/users', proxy(config.services.user));
router.use('/search', searchRateLimiter, proxy(config.services.search));
router.use('/trains', proxy(config.services.train));
router.use('/bookings', bookingRateLimiter, proxy(config.services.booking));
router.use('/seats', proxy(config.services.seat));
router.use('/payments', proxy(config.services.payment));
router.use('/tracking', proxy(config.services.tracking));

export default router;
