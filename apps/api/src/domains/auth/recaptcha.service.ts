import { env } from '../../shared/config/env.js';

export async function verifyRecaptcha(token: string): Promise<boolean> {
  // In development/test mode with mock tokens, bypass external verification
  if (env.NODE_ENV !== 'production' && (token === 'mock_token' || token === 'test_token')) {
    return true;
  }

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data = (await res.json()) as { success: boolean; score?: number };
    return data.success && (data.score === undefined || data.score >= 0.5);
  } catch (err) {
    console.error('❌ reCAPTCHA verification error:', err);
    return false;
  }
}
