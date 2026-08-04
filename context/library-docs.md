# library-docs.md — TrainTravel

> Canonical reference for every third-party library in this stack — pinned versions (checked Aug 2026) and minimal correct usage snippets. Use these exact patterns rather than recalling an API from memory or training data; SDKs change between major versions and this file is the source of truth for this repo. If a library isn't listed here, check its current npm page before using it, and add an entry.

---

## Backend (`apps/api`)

### express — HTTP server
```bash
npm i express
npm i -D @types/express
```
```ts
import express from 'express';
const app = express();
app.use(express.json());
app.listen(process.env.PORT, () => console.log(`listening on ${process.env.PORT}`));
```

### prisma / @prisma/client — ORM
```bash
npm i @prisma/client
npm i -D prisma
npx prisma init
```
- Every schema change: `npx prisma migrate dev --name <name>`.
- `shared/prisma/client.ts` — the **only** place `PrismaClient` is instantiated:
```ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

### ioredis — Redis client
```bash
npm i ioredis
```
```ts
import Redis from 'ioredis';
export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || undefined,
});

// OTP set with TTL (architecture.md §5)
await redis.set(`otp:${target}`, code, 'EX', 300);

// Seat lock (architecture.md §5)
const acquired = await redis.set(lockKey, userId, 'EX', 600, 'NX');
if (!acquired) throw new AppError('SEAT_LOCK_CONFLICT', 'Seat already held', 409);

// Pub/Sub (shared/events/bus.ts)
const publisher = new Redis(redisOpts);
const subscriber = new Redis(redisOpts);
await publisher.publish('booking.confirmed', JSON.stringify(payload));
await subscriber.subscribe('booking.confirmed');
subscriber.on('message', (channel, message) => { /* handle */ });
```

### jsonwebtoken — JWT issuance/verification
```bash
npm i jsonwebtoken
npm i -D @types/jsonwebtoken
```
```ts
import jwt from 'jsonwebtoken';

const accessToken = jwt.sign(
  { sub: user.id },
  process.env.JWT_ACCESS_SECRET!,
  { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN } // e.g. '15m'
);

const refreshToken = jwt.sign(
  { sub: user.id },
  process.env.JWT_REFRESH_SECRET!,
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN } // e.g. '7d'
);

// verify (in auth.middleware.ts)
const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { sub: string };
```

### passport / passport-google-oauth20 — Google OAuth2
```bash
npm i passport passport-google-oauth20
npm i -D @types/passport @types/passport-google-oauth20
```
```ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback',
  },
  async (_accessToken, _refreshToken, profile, done) => {
    // find-or-create User by profile.id / profile.emails[0].value
    done(null, user);
  }
));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
app.get('/auth/google/callback', passport.authenticate('google', { session: false }), issueJwtAndRedirect);
```

### razorpay (v2.9.6) — payments
```bash
npm i razorpay
```
```ts
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create an order (payment.service.ts)
const order = await razorpay.orders.create({
  amount: fareTotal * 100, // paise
  currency: 'INR',
  receipt: bookingId,
});

// Verify webhook signature (payment.controller.ts) — do this BEFORE trusting any field
function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');
  return expected === signatureHeader;
}
```
> Note: the Express route handling `/payment/webhook` must be mounted with the **raw body** parser (`express.raw({ type: 'application/json' })`), not the global JSON parser — signature verification requires the exact raw bytes Razorpay signed.

### twilio (v6.0.2, requires Node ≥20) — SMS
```bash
npm i twilio
```
```ts
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

await client.messages.create({
  body: `Your TrainTravel OTP is ${code}`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phoneNumber, // E.164 format, e.g. +91XXXXXXXXXX
});
```

### resend (v6.18.1) — transactional email
```bash
npm i resend
```
```ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM!, // must be a domain-verified sender in production
  to: [userEmail],
  subject: 'Your TrainTravel booking is confirmed',
  html: renderedTemplate,
});
if (error) logger.warn({ error }, 'resend send failed');
```

### zod — request/schema validation
```bash
npm i zod
```
```ts
import { z } from 'zod';

const holdBookingSchema = z.object({
  trainNumber: z.string(),
  travelClass: z.enum(['SL', '3A', '2A', '1A']),
  quota: z.enum(['GENERAL', 'TATKAL', 'LADIES']),
  journeyDate: z.string().date(),
});

// in controller, before calling the service
const input = holdBookingSchema.parse(req.body); // throws ZodError → caught by error.middleware.ts
```

### pino — structured logging
```bash
npm i pino
npm i -D pino-http
```
```ts
import pino from 'pino';
export const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

// per-request logger via pino-http in gateway middleware, attaches req.log with requestId
```

---

## Google reCAPTCHA v3 — server-side verification (no SDK needed, plain fetch)
```ts
async function verifyRecaptcha(token: string): Promise<boolean> {
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY!,
      response: token,
    }),
  });
  const data = await res.json();
  return data.success && data.score >= 0.5;
}
```
Frontend loads the script with `RECAPTCHA_SITE_KEY` and calls `grecaptcha.execute(siteKey, { action: 'otp_request' })` to get the token to send server-side.

---

## Frontend (`apps/web`)

### next.js + react — app framework
```bash
npx create-next-app@latest apps/web --typescript --tailwind --app
```
- Use the App Router (`app/` directory) per the page list in `architecture.md` §3.
- Server Components by default; mark a file `'use client'` only when it needs state/effects/event handlers (forms, the search widget, the auth modal, the Razorpay checkout trigger).

### tailwindcss — styling
- Configure brand tokens (indigo/amber palette from the design doc) in `tailwind.config.ts` under `theme.extend.colors`, not as ad-hoc hex values in components.

### react-hook-form + @hookform/resolvers + zod — forms
```bash
npm i react-hook-form @hookform/resolvers zod
```
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const passengerSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().min(1).max(120),
  gender: z.enum(['M', 'F', 'O']),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(passengerSchema),
});
```

### Razorpay Checkout (frontend, script-tag based — no npm package needed)
```tsx
// load once: <script src="https://checkout.razorpay.com/v1/checkout.js" />
function openRazorpayCheckout(order: { id: string; amount: number }, keyId: string) {
  const rzp = new (window as any).Razorpay({
    key: keyId, // RAZORPAY_KEY_ID — public, safe on client
    amount: order.amount,
    currency: 'INR',
    order_id: order.id,
    handler: (response: any) => { /* POST response to backend to confirm, though real confirmation comes from the webhook */ },
  });
  rzp.open();
}
```
> `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` never reach the frontend — only `RAZORPAY_KEY_ID` (public) is passed to the client, via the `/payment/order` response as documented in `architecture.md` §8.

---

## Dev tooling

| Tool | Purpose |
|---|---|
| `typescript` | strict mode everywhere, see `code-standards.md` §1 |
| `eslint` + `@typescript-eslint/*` | linting |
| `prettier` | formatting |
| `docker` / `docker-compose` | local Postgres + Redis + api |
| `vitest` or `jest` | unit/integration tests (`code-standards.md` §10) |
| `husky` + `lint-staged` (optional) | pre-commit lint/format gate |

---

## Version pinning policy

- Pin exact versions (no `^`/`~`) for anything touching money or auth: `razorpay`, `jsonwebtoken`, `passport-google-oauth20`. Caret ranges are fine for everything else.
- Before adding any library not listed here, check its current npm page (`npmjs.com/package/<name>`) for the latest stable version and note the Node engine requirement — several libraries in this stack (e.g. `twilio` 6.x) require Node ≥20.
- Update this file whenever a dependency is upgraded across a major version, since the usage snippet may no longer be accurate.

---

*Last verified against npm registry: Aug 4, 2026. Re-check before a production deploy if this file is more than a few months old — payment and auth SDKs change fast.*