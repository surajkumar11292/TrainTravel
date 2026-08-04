import { Router } from 'express';
import passport from 'passport';
import { authController } from './auth.controller.js';
import { authMiddleware } from '../../gateway/middleware/auth.middleware.js';

const router = Router();

router.post('/otp/request', (req, res, next) => authController.requestOtp(req, res, next));
router.post('/otp/verify', (req, res, next) => authController.verifyOtp(req, res, next));

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  (req, res) => {
    // Successfully authenticated via Google
    res.redirect('/?auth=success');
  }
);

router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));

export const authRouter = router;
