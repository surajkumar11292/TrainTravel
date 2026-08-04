import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../../shared/config/env.js';
import { authService } from './auth.service.js';

export function configureGoogleStrategy(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const { user } = await authService.loginWithGoogleProfile({
            googleId: profile.id,
            email,
          });
          done(null, user);
        } catch (err) {
          done(err as Error, undefined);
        }
      }
    )
  );
}
