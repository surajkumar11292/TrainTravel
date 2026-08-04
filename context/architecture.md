# architecture.md — TrainTravel

> This file is the source of truth for any AI coding agent (Claude Code, Cursor, etc.) working on this repo. Read this before generating code. Follow the folder structure, naming, contracts, and conventions exactly so services can be extracted later without a rewrite.

---

## 1. System summary

TrainTravel is a train-ticket booking web app. Users authenticate with **email or phone + OTP, or Google OAuth** — no separate IRCTC login is ever shown to the user. Login is required before checkout (no guest checkout).

**Build phase:** modular monolith. One Node.js/TypeScript codebase, one Postgres database (schema-per-domain), one Redis instance, one process on `PORT=4000`. Code is organized so any domain folder can be lifted into its own service + its own DB behind the API Gateway later, with no rewrite — only a deployment change and a switch from in-process function calls to HTTP/event calls.

**Do not** introduce a service mesh, Kubernetes, or a message broker (Kafka/RabbitMQ) in phase 1. Use Redis Pub/Sub for async events. Revisit only when a specific domain (almost always Search) is measurably the bottleneck.

---

## 2. Domain map

| Domain folder | Owns | Talks to | Primary DB tables |
|---|---|---|---|
| `auth` | Signup/login, OTP issuance+verify, Google OAuth, JWT issue/refresh/revoke, reCAPTCHA verification | `notification` (send OTP), `users` (create profile on first login) | `auth.users`, `auth.refresh_tokens` |
| `users` | Profile, saved passengers, contact preferences | — | `users.profiles`, `users.saved_passengers` |
| `search` | Station autocomplete, train-between-stations, seat availability, fare calc, PNR status, live train status | External rail-data provider (see §9) | `search.stations`, `search.trains` (reference/cache data only) |
| `booking` | Seat hold (lock), passenger capture, PNR/order creation, booking lifecycle state machine | `search` (re-check availability), `payment` (create order), `notification` (emit confirm/cancel events) | `booking.bookings`, `booking.passengers`, `booking.status_history` |
| `payment` | Razorpay order creation, signature verification, webhook handling, refunds | `booking` (confirm/rollback on payment result) | `payment.payments`, `payment.refunds` |
| `notification` | Send OTP/SMS/email, consume async events, template rendering | Twilio, Resend | `notification.messages_log` |
| `gateway` | Single public entrypoint, JWT verification middleware, rate limiting, routing, CORS/security headers, request logging | all domains | — (stateless) |

---

## 3. Repo / folder structure

```
traintravel/
├── apps/
│   ├── api/                      # the single Node/TS process (phase-1 monolith)
│   │   ├── src/
│   │   │   ├── gateway/          # express app entry, middleware, routing table
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── auth.middleware.ts       # verifies JWT, attaches req.user
│   │   │   │   │   ├── rateLimit.middleware.ts  # redis-backed
│   │   │   │   │   └── error.middleware.ts      # centralized error formatter
│   │   │   │   └── router.ts
│   │   │   ├── domains/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts          # business logic, no HTTP concerns
│   │   │   │   │   ├── auth.repository.ts       # Prisma queries only
│   │   │   │   │   ├── otp.service.ts
│   │   │   │   │   ├── google-oauth.service.ts
│   │   │   │   │   └── auth.events.ts           # publishes/subscribes redis events
│   │   │   │   ├── users/          (same pattern)
│   │   │   │   ├── search/         (same pattern)
│   │   │   │   ├── booking/        (same pattern)
│   │   │   │   ├── payment/        (same pattern)
│   │   │   │   └── notification/   (same pattern)
│   │   │   ├── shared/
│   │   │   │   ├── redis/client.ts
│   │   │   │   ├── prisma/client.ts
│   │   │   │   ├── events/bus.ts                # thin wrapper over redis pub/sub
│   │   │   │   ├── errors/AppError.ts
│   │   │   │   └── config/env.ts                # validates & exports all env vars
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma       # one file, one schema per domain (see §4)
│   │   └── package.json
│   └── web/                        # Next.js + Tailwind frontend
│       └── src/
│           ├── app/
│           │   ├── page.tsx                     # home (hero search)
│           │   ├── search-results/page.tsx
│           │   ├── booking/[trainId]/page.tsx
│           │   ├── payment/[bookingId]/page.tsx
│           │   ├── confirmation/[pnr]/page.tsx
│           │   ├── pnr-status/page.tsx
│           │   ├── live-train-status/page.tsx
│           │   └── my-bookings/page.tsx
│           ├── components/
│           │   ├── search/SearchWidgetCard.tsx
│           │   ├── search/QuickFilterChips.tsx
│           │   ├── results/TrainResultCard.tsx
│           │   ├── booking/PassengerForm.tsx
│           │   ├── booking/FareSummaryCard.tsx
│           │   ├── auth/AuthModal.tsx
│           │   └── layout/{Header,Footer,PromoBanner}.tsx
│           └── lib/api-client.ts                 # calls the gateway, attaches JWT
├── docker-compose.yml               # api + postgres + redis
├── .env.example                     # var NAMES only, no values
└── architecture.md                  # this file
```

**Rule for the agent:** never put Prisma calls or HTTP req/res objects inside a `*.service.ts` file. Controllers touch HTTP. Repositories touch Prisma. Services contain logic only and are what you'd unit test. This boundary is what makes later extraction into real microservices mechanical instead of a rewrite.

---

## 4. Database schema (Postgres via Prisma, one DB `traintravel_db`, schema-per-domain)

```prisma
// ── auth schema ──────────────────────────────────
model User {
  id            String   @id @default(uuid())
  email         String?  @unique
  phone         String?  @unique
  googleId      String?  @unique
  emailVerified Boolean  @default(false)
  phoneVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  @@schema("auth")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())
  @@schema("auth")
}

// ── users schema ─────────────────────────────────
model Profile {
  userId       String   @id
  fullName     String?
  defaultEmail String?
  defaultPhone String?
  @@schema("users")
}

model SavedPassenger {
  id        String  @id @default(uuid())
  userId    String
  name      String
  age       Int
  gender    String
  berthPref String?
  @@schema("users")
}

// ── search schema (reference/cache data) ─────────
model Station {
  code String @id
  name String
  city String
  @@schema("search")
}

model Train {
  number       String @id
  name         String
  runsOn       String[] // ['MON','TUE',...]
  @@schema("search")
}

// ── booking schema ────────────────────────────────
model Booking {
  id            String   @id @default(uuid())
  userId        String
  trainNumber   String
  fromStation   String
  toStation     String
  journeyDate   DateTime
  travelClass   String
  quota         String
  pnr           String?  @unique
  status        String   // HOLD | PENDING_PAYMENT | CONFIRMED | RAC | WAITLISTED | CANCELLED | EXPIRED
  fareTotal     Decimal
  contactEmail  String
  contactPhone  String
  createdAt     DateTime @default(now())
  @@schema("booking")
}

model Passenger {
  id        String @id @default(uuid())
  bookingId String
  name      String
  age       Int
  gender    String
  berthPref String?
  @@schema("booking")
}

model BookingStatusHistory {
  id        String   @id @default(uuid())
  bookingId String
  status    String
  note      String?
  at        DateTime @default(now())
  @@schema("booking")
}

// ── payment schema ────────────────────────────────
model Payment {
  id             String   @id @default(uuid())
  bookingId      String   @unique
  razorpayOrderId   String @unique
  razorpayPaymentId String?
  amount         Decimal
  status         String   // CREATED | CAPTURED | FAILED | REFUNDED
  createdAt      DateTime @default(now())
  @@schema("payment")
}

model Refund {
  id        String   @id @default(uuid())
  paymentId String
  amount    Decimal
  status    String   // INITIATED | PROCESSED | FAILED
  createdAt DateTime @default(now())
  @@schema("payment")
}

// ── notification schema ───────────────────────────
model MessageLog {
  id        String   @id @default(uuid())
  channel   String   // SMS | EMAIL
  toAddr    String
  template  String
  status    String   // SENT | FAILED
  sentAt    DateTime @default(now())
  @@schema("notification")
}
```

---

## 5. Redis key patterns

| Purpose | Key pattern | TTL |
|---|---|---|
| OTP code | `otp:{email_or_phone}` | 5 min |
| OTP send rate limit | `otp:ratelimit:{email_or_phone}` (counter) | 10 min |
| Refresh token session | `session:{userId}:{tokenId}` | 7 days |
| Seat hold / distributed lock | `seatlock:{trainNumber}:{date}:{class}:{userId}` | 10 min |
| Search results cache | `search:{from}:{to}:{date}` | 60 sec |
| Gateway rate limit (per IP) | `ratelimit:{ip}:{route}` | 1 min window |

**Seat hold pattern (critical section in `booking.service.ts`):**
1. `SET seatlock:... NX EX 600` — if this fails, another user holds the seat, return 409.
2. On success, create `Booking` row with `status = HOLD`.
3. On payment capture webhook → `status = CONFIRMED`, delete the lock key, generate PNR.
4. On payment failure/timeout → `status = EXPIRED`, delete the lock key (or let TTL expire it naturally).

---

## 6. Async events (Redis Pub/Sub via `shared/events/bus.ts`)

| Event | Published by | Consumed by | Payload |
|---|---|---|---|
| `otp.requested` | `auth` | `notification` | `{ target, channel, code }` |
| `user.registered` | `auth` | `notification` | `{ userId, email }` |
| `booking.hold_created` | `booking` | — (future: analytics) | `{ bookingId }` |
| `payment.captured` | `payment` | `booking`, `notification` | `{ bookingId, paymentId }` |
| `payment.failed` | `payment` | `booking`, `notification` | `{ bookingId, reason }` |
| `booking.confirmed` | `booking` | `notification` | `{ bookingId, pnr, contactEmail, contactPhone }` |
| `booking.cancelled` | `booking` | `notification`, `payment` (trigger refund) | `{ bookingId, reason }` |

**Rule for the agent:** domains never import each other's `.service.ts` directly for these actions — they publish an event and move on. This keeps the payment→booking→notification chain non-blocking and is exactly the seam microservice extraction will later cut along.

---

## 7. Auth flow (sequence)

```
User → Gateway: POST /auth/otp/request { emailOrPhone }
Gateway → Auth: verify reCAPTCHA token (RECAPTCHA_SECRET_KEY)
Auth → Redis: rate-limit check on otp:ratelimit:{target}
Auth: generate 6-digit code → Redis SET otp:{target} EX 300
Auth → EventBus: publish otp.requested
Notification: consumes event → sends via Resend (email) or Twilio (SMS)
Gateway ← Auth: 200 { message: "OTP sent" }

User → Gateway: POST /auth/otp/verify { emailOrPhone, code }
Auth: Redis GET otp:{target}, compare
Auth → Postgres: upsert User (create if first login)
Auth: issue JWT access (15m) + refresh (7d), store refresh hash in Redis + Postgres
Gateway ← Auth: 200 { accessToken, refreshToken(httpOnly cookie), user }
```

Google OAuth path: `GET /auth/google` → redirect → `GET /auth/google/callback` → same "issue JWT" step as above, `googleId` used to find-or-create the `User` row instead of OTP.

---

## 8. Booking flow (sequence)

```
User → Gateway: GET /search/trains?from=NDLS&to=CSTM&date=2026-08-10
  (Gateway requires valid access JWT for booking-adjacent calls; search itself can be public)

User → Gateway: POST /booking/hold { trainNumber, class, quota, date }  [auth required]
Booking: Redis SETNX seatlock:... → creates Booking(status=HOLD)

User → Gateway: PATCH /booking/{id}/passengers { passengers[], contactEmail, contactPhone }

User → Gateway: POST /payment/order { bookingId }
Payment: razorpay.orders.create(...) → Payment(status=CREATED)
Gateway ← Payment: { razorpayOrderId, keyId: RAZORPAY_KEY_ID }
Frontend: opens Razorpay checkout with that order id

Razorpay → Payment webhook: POST /payment/webhook  (signature verified with RAZORPAY_WEBHOOK_SECRET)
Payment: verify signature → Payment(status=CAPTURED) → publish payment.captured

Booking: consumes payment.captured → generate PNR → Booking(status=CONFIRMED) → publish booking.confirmed
Notification: consumes booking.confirmed → sends ticket email (Resend) + SMS (Twilio)

User → Gateway: GET /booking/{id}  → returns final PNR + status
```

**Never** mark a booking confirmed from a client-side "payment success" callback alone — confirmation only happens from the server-verified webhook.

---

## 9. External dependency the agent cannot solve with code alone

`search` domain needs real train schedule / live seat availability / PNR data. None of the provided env vars cover this. For local development, stub `search.repository.ts` with fixture/mock data (a JSON file of a handful of routes/trains) behind the same interface a real provider would use, so swapping in a licensed rail-data API later touches one file.

---

## 10. Environment variables (names only — see `.env.example`)

```
NODE_ENV, PORT
DATABASE_URL
REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
RESEND_API_KEY, EMAIL_FROM
```

All of these are validated at boot in `shared/config/env.ts` (fail fast if any required var is missing) — do not read `process.env` directly anywhere else in the codebase.

---

## 11. API route table (gateway → domain)

| Method | Route | Auth required | Domain |
|---|---|---|---|
| POST | `/auth/otp/request` | no | auth |
| POST | `/auth/otp/verify` | no | auth |
| GET | `/auth/google` | no | auth |
| GET | `/auth/google/callback` | no | auth |
| POST | `/auth/refresh` | refresh cookie | auth |
| POST | `/auth/logout` | yes | auth |
| GET | `/users/me` | yes | users |
| PATCH | `/users/me` | yes | users |
| GET | `/search/stations?q=` | no | search |
| GET | `/search/trains?from=&to=&date=` | no | search |
| GET | `/search/pnr/{pnr}` | no | search |
| GET | `/search/live-status/{trainNumber}` | no | search |
| POST | `/booking/hold` | yes | booking |
| PATCH | `/booking/{id}/passengers` | yes | booking |
| GET | `/booking/{id}` | yes | booking |
| GET | `/booking/my` | yes | booking |
| POST | `/booking/{id}/cancel` | yes | booking |
| POST | `/payment/order` | yes | payment |
| POST | `/payment/webhook` | no (signature-verified instead) | payment |

---

## 12. Non-functional conventions

- All responses: `{ success: boolean, data?: T, error?: { code, message } }` — one shape, enforced in `error.middleware.ts`.
- All list endpoints support `?page=&limit=` pagination.
- All domain services throw `AppError(code, message, httpStatus)` — never throw raw errors or return partial HTTP responses from inside a service.
- Logging: structured JSON logs (`pino` recommended), one line per request from the gateway with `requestId`, `route`, `status`, `durationMs`.
- Every external call (Razorpay, Twilio, Resend, Google) goes through a thin wrapper in that domain's folder (e.g. `payment/razorpay.client.ts`) — never call the SDK directly from a controller.

---

*This file should be updated whenever a domain boundary, event, or route changes — treat it as living documentation, not a one-time scaffold note.*