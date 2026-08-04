# build-plan.md — TrainTravel

> Execution plan for an AI coding agent. Follow phases **in order** — each phase has a "Definition of Done" gate; don't start the next phase until the current one's gate passes. This plan implements the structure defined in `architecture.md` — read that file first, this file just sequences the work.

**Ground rules for the agent:**
- Work inside `apps/api` and `apps/web` per the folder structure in `architecture.md` — don't deviate from it.
- Never hardcode a secret; every credential comes from `process.env` via `shared/config/env.ts`.
- Commit after each phase's Definition of Done passes, with a message matching the phase name (e.g. `feat: phase 2 - auth domain`).
- If a phase requires a decision not covered in `architecture.md` (e.g. exact OTP length, token cookie name), make the smallest reasonable choice, note it in a `## Decisions` section at the bottom of this file, and move on — don't stall waiting for input.

---

## Phase 0 — Repo & tooling scaffold

**Goal:** empty-but-runnable skeleton, nothing domain-specific yet.

- [x] Init monorepo: `apps/api`, `apps/web`, root `package.json` with workspaces (npm/pnpm workspaces).
- [x] `apps/api`: Node + TypeScript + Express (or Fastify) skeleton, `tsconfig.json`, `main.ts` boots an Express app on `PORT` from env, `GET /health` returns `{ status: "ok" }`.
- [x] `apps/web`: Next.js + TypeScript + Tailwind, default starter page.
- [x] `.env.example` with every var name from `architecture.md` §10 (no values).
- [x] `.gitignore` includes `.env`, `node_modules`, `dist`, `.next`.
- [x] `docker-compose.yml`: `postgres:16`, `redis:7`, and the `api` service, wired to read `.env`.
- [x] `shared/config/env.ts`: loads and validates all required env vars at boot (fail fast with a clear error listing which var is missing).

**Definition of Done:** `docker compose up` starts Postgres + Redis + API; `curl localhost:4000/health` returns 200. `npm run dev` in `apps/web` shows the default Next.js page.

---

## Phase 1 — Database layer

**Goal:** schema exists and is migrated; Prisma client generated.

- [x] Install Prisma in `apps/api`, point `DATABASE_URL` at the compose Postgres.
- [x] Write `prisma/schema.prisma` exactly matching `architecture.md` §4 (all 4 schemas: auth, users, search, booking, payment, notification — 6 total).
- [x] `prisma migrate dev --name init` — creates all tables.
- [x] Seed script (`prisma/seed.ts`) that inserts ~10 fixture `Station` rows and ~5 fixture `Train` rows (real Indian station codes/names is fine, e.g. NDLS, CSTM, MAS, HWH, SBC) — this is the stand-in rail-data referenced in `architecture.md` §9.
- [x] `shared/prisma/client.ts` exports a single shared `PrismaClient` instance (never `new PrismaClient()` inside a repository file).

**Definition of Done:** `prisma studio` shows all tables empty except `Station`/`Train` seed rows.

---

## Phase 2 — Redis & event bus plumbing

**Goal:** the shared infra every domain will depend on.

- [x] `shared/redis/client.ts`: single ioredis instance from `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`.
- [x] `shared/events/bus.ts`: thin `publish(event, payload)` / `subscribe(event, handler)` wrapper over Redis Pub/Sub, typed against the event table in `architecture.md` §6.
- [x] `rateLimit.middleware.ts`: generic Redis-backed fixed-window limiter, configurable per-route (used later by gateway + OTP endpoints).
- [x] `error.middleware.ts` + `shared/errors/AppError.ts`: implements the single response shape from `architecture.md` §12.

**Definition of Done:** a throwaway test script can `publish('test.event', {foo:1})` and a `subscribe` handler in the same process logs it.

---

## Phase 3 — Auth domain

**Goal:** signup/login fully working (OTP + Google), JWT issuance, refresh, logout.

- [ ] `auth.repository.ts`: Prisma CRUD for `User`, `RefreshToken`.
- [ ] `otp.service.ts`: generate 6-digit code, `SET otp:{target} EX 300`, rate-limit via `otp:ratelimit:{target}` (max 3 / 10 min).
- [ ] reCAPTCHA v3 verification: server-side call to Google's siteverify endpoint using `RECAPTCHA_SECRET_KEY`, reject if score below threshold (e.g. 0.5).
- [ ] `google-oauth.service.ts`: `passport-google-oauth20` strategy using `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
- [ ] JWT issuance: access token (`JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`) + refresh token (`JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`), refresh token hash stored in `RefreshToken` table + Redis session key.
- [ ] Routes per `architecture.md` §11: `POST /auth/otp/request`, `POST /auth/otp/verify`, `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/refresh`, `POST /auth/logout`.
- [ ] `auth.middleware.ts`: verifies access JWT on protected routes, attaches `req.user`.
- [ ] On successful OTP verify or Google callback: find-or-create `User`, publish `user.registered` on first creation.

**Definition of Done:** end-to-end manual test — request OTP for a test email, read the code from Redis (dev-only debug log), verify it, receive an access+refresh token pair, call a dummy protected route successfully, refresh the token, log out and confirm the old refresh token is rejected.

---

## Phase 4 — Users domain

**Goal:** profile + saved passengers, minimal but complete.

- [ ] `GET /users/me`, `PATCH /users/me` — profile read/update.
- [ ] `SavedPassenger` CRUD (used later to pre-fill the booking passenger form).
- [ ] Auto-create a `Profile` row when `user.registered` event fires (subscribe in `users` domain).

**Definition of Done:** logged-in user can fetch and update their profile; saved passengers persist across requests.

---

## Phase 5 — Search domain (fixture-backed)

**Goal:** search/autocomplete/PNR/live-status endpoints work against seeded fixture data, behind the real interface a licensed provider would later fill in.

- [ ] `search.repository.ts` interface: `findStations(query)`, `findTrains(from, to, date)`, `getPnrStatus(pnr)`, `getLiveStatus(trainNumber)`. Implement against the seeded fixture data for now.
- [ ] Cache train search responses: `search:{from}:{to}:{date}` in Redis, 60s TTL.
- [ ] Fare calc: simple deterministic formula per class (placeholder logic, clearly commented as a stand-in for a real fare engine).
- [ ] Routes per `architecture.md` §11 (all public, no auth).

**Definition of Done:** `GET /search/trains?from=NDLS&to=CSTM&date=<future date>` returns a list of fixture trains with class/price/availability; hitting it twice within 60s shows a cache hit in logs.

---

## Phase 6 — Booking domain

**Goal:** seat-hold → passenger capture → booking record lifecycle, per the sequence in `architecture.md` §8.

- [ ] `POST /booking/hold`: Redis `SETNX seatlock:{train}:{date}:{class}:{userId} EX 600`; on success create `Booking(status=HOLD)`; on failure return 409.
- [ ] `PATCH /booking/{id}/passengers`: writes `Passenger` rows (max 6, or 4 if `quota=TATKAL`), writes `contactEmail`/`contactPhone` onto the booking (pre-filled from the user's profile, editable).
- [ ] `GET /booking/{id}`, `GET /booking/my` (paginated), `POST /booking/{id}/cancel`.
- [ ] Subscribe to `payment.captured` → generate PNR (simple deterministic mock generator is fine), set `status=CONFIRMED`, log to `BookingStatusHistory`, delete the seat lock key, publish `booking.confirmed`.
- [ ] Subscribe to `payment.failed` → `status=EXPIRED`, delete lock key.
- [ ] A scheduled cleanup (simple `setInterval` is fine at this stage) expires any `HOLD` booking whose lock TTL has lapsed without payment.

**Definition of Done:** can hold a seat, attempt a second hold on the same train/date/class/user and get a 409, attach passengers, and see the booking sit in `HOLD` until a (simulated) payment event flips it to `CONFIRMED` with a PNR.

---

## Phase 7 — Payment domain

**Goal:** real Razorpay order + signature-verified webhook, per `architecture.md` §8.

- [ ] `razorpay.client.ts` wrapper using `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`.
- [ ] `POST /payment/order`: creates a Razorpay order for the booking's `fareTotal`, stores `Payment(status=CREATED)`, returns `{ razorpayOrderId, keyId }` to the client.
- [ ] `POST /payment/webhook`: verifies `RAZORPAY_WEBHOOK_SECRET` signature on the raw request body **before** parsing/trusting anything in it; on `payment.captured` event from Razorpay, set `Payment(status=CAPTURED)` and publish internal `payment.captured`; on failure publish `payment.failed`.
- [ ] Refund flow: `Refund` record + Razorpay refund API call, triggered by `booking.cancelled` event.

**Definition of Done:** using Razorpay test mode, complete a full test payment, confirm the webhook fires, signature verifies, and `Payment.status` flips to `CAPTURED`, which in turn flips the linked `Booking` to `CONFIRMED` (Phase 6 subscriber).

---

## Phase 8 — Notification domain

**Goal:** OTP/SMS/email actually deliver, driven entirely by events (never called synchronously from other domains).

- [ ] `twilio.client.ts`, `resend.client.ts` wrappers.
- [ ] Subscribe `otp.requested` → send via SMS (Twilio) if phone target, or email (Resend) if email target.
- [ ] Subscribe `booking.confirmed` → send ticket/PNR confirmation via both SMS and email to `contactPhone`/`contactEmail`.
- [ ] Subscribe `booking.cancelled` / `payment.failed` → send appropriate status update.
- [ ] Log every send attempt (success or failure) to `MessageLog`.
- [ ] Failures here must never throw back into the publisher — log and move on (notification is best-effort, not a blocker for booking correctness).

**Definition of Done:** a real OTP SMS/email arrives in test mode for a real phone/email; a booking confirmation email/SMS arrives after Phase 7's test payment completes.

---

## Phase 9 — Frontend (Next.js) — page by page

Build in this order, matching `architecture.md`'s route table and the UI spec from the earlier design doc. Each page should call the gateway via `lib/api-client.ts` (attaches the access token, handles 401 → refresh transparently).

- [ ] `components/layout/{Header,Footer,PromoBanner}.tsx`
- [ ] `components/auth/AuthModal.tsx` (OTP tab + Google tab) wired to `/auth/*` routes
- [ ] `app/page.tsx` — home: hero, `SearchWidgetCard`, quick filter chips, trust tiles, FAQ accordion
- [ ] `app/search-results/page.tsx` — filter sidebar + `TrainResultCard` list, wired to `/search/trains`
- [ ] `app/booking/[trainId]/page.tsx` — `PassengerForm` + `FareSummaryCard`, wired to `/booking/hold` then `/booking/{id}/passengers`
- [ ] `app/payment/[bookingId]/page.tsx` — calls `/payment/order`, opens Razorpay checkout widget client-side
- [ ] `app/confirmation/[pnr]/page.tsx` — booking summary, download/share ticket
- [ ] `app/pnr-status/page.tsx`, `app/live-train-status/page.tsx` — simple lookup forms against `/search/*`
- [ ] `app/my-bookings/page.tsx` — list + cancel action

**Definition of Done:** a user can, entirely through the UI, log in, search a route, pick a train, enter passengers, pay via Razorpay test mode, and land on a confirmation page showing a real PNR — with no direct API calls, only through `lib/api-client.ts`.

---

## Phase 10 — End-to-end integration pass

- [ ] Full manual run-through of the happy path from a clean database.
- [ ] Failure-path checks: expired OTP, wrong OTP, seat-hold conflict (409), payment failure (Razorpay test failure card), webhook signature tampering (should reject), booking cancellation → refund.
- [ ] Confirm every response follows the single response shape (`architecture.md` §12).
- [ ] Confirm no secret ever appears in a client-side bundle or log line (grep build output for key prefixes as a sanity check).

**Definition of Done:** all of the above pass without manual DB edits.

---

## Phase 11 — Hardening pass

- [ ] Apply the full security checklist from the previous design doc: OTP rate limiting confirmed active, webhook signature verification confirmed active, refresh tokens in httpOnly+secure cookies (not localStorage), short-lived access tokens confirmed.
- [ ] Add `helmet`-equivalent security headers + CORS allow-list at the gateway.
- [ ] Structured request logging with `requestId` on every request (per `architecture.md` §12).
- [ ] Basic load sanity check on `/search/trains` (the expected first bottleneck) — confirm the Redis cache is actually reducing DB hits.

**Definition of Done:** hardening checklist fully checked off; no plaintext secret anywhere in the repo (`git log -p` and current tree both clean).

---

## Phase 12 — Deployment prep (not full deploy)

- [ ] Production `docker-compose.prod.yml` or Dockerfile per app, multi-stage build.
- [ ] Document (in a new `DEPLOY.md`) how env vars are injected in the target environment (Railway/Render/AWS — whichever is chosen) via a secrets manager, not a committed `.env`.
- [ ] Confirm `EMAIL_FROM` is switched to a domain-verified sender before go-live (a personal Gmail address should not be the production sender).

**Definition of Done:** a fresh clone + documented env setup + `docker compose up` reproduces the full working app with zero code changes.

---

## Decisions log
*(the agent appends here any small implementation choices it had to make that weren't specified above)*

-