# progress-tracker.md — TrainTravel

> **Living document.** The agent updates this file at the end of every work session and after every phase gate passes. This is the first file to read when resuming work — it tells you exactly where the last session left off, what's blocked, and what decision was made that isn't obvious from the code alone. `build-plan.md` defines the *plan*; this file records the *actual state*.

**Update rules for the agent:**
- Tick a checkbox only when the task is actually done and, where applicable, its Definition of Done check has been run — not when code merely "looks right."
- Every session ends with a new entry at the bottom of the **Session Log**, even if the session was short or hit a blocker.
- If a phase's Definition of Done fails, log it under **Blockers** with enough detail that the next session doesn't have to re-diagnose from scratch.
- Never delete a past Session Log entry — this file is an append-only history plus a live status table.

---

## 1. Overall status

| | |
|---|---|
| **Current phase** | Phase 6 — Booking domain |
| **Last updated** | 2026-08-04 |
| **Blockers** | None |
| **Docs in place** | `TrainTravel-Project-Prompt.md`, `architecture.md`, `build-plan.md`, `code-standards.md`, `library-docs.md`, `progress-tracker.md` |
| **Repo state** | Phase 5 complete (Station autocomplete, train search with 60s Redis caching, fare calculation, PNR & live status lookups) |

---

## 2. Phase status board

Status values: `☐ Not started` · `🔄 In progress` · `⚠️ Blocked` · `✅ Done`

| Phase | Name | Status | Definition of Done met? |
|---|---|---|---|
| 0 | Repo & tooling scaffold | ✅ Done | Yes |
| 1 | Database layer | ✅ Done | Yes |
| 2 | Redis & event bus plumbing | ✅ Done | Yes |
| 3 | Auth domain | ✅ Done | Yes |
| 4 | Users domain | ✅ Done | Yes |
| 5 | Search domain (fixture-backed) | ✅ Done | Yes |
| 6 | Booking domain | ☐ Not started | — |
| 7 | Payment domain | ☐ Not started | — |
| 8 | Notification domain | ☐ Not started | — |
| 9 | Frontend | ☐ Not started | — |
| 10 | End-to-end integration pass | ☐ Not started | — |
| 11 | Hardening pass | ☐ Not started | — |
| 12 | Deployment prep | ☐ Not started | — |

---

## 3. Task-level checklist

*(mirrors `build-plan.md` exactly — tick here as work completes; keep both files in sync)*

### Phase 0 — Repo & tooling scaffold
- [x] Monorepo init (`apps/api`, `apps/web`, workspaces)
- [x] `apps/api` skeleton + `/health` route
- [x] `apps/web` Next.js + Tailwind skeleton
- [x] `.env.example` complete
- [x] `.gitignore` correct
- [x] `docker-compose.yml` (postgres, redis, api)
- [x] `shared/config/env.ts` validation

### Phase 1 — Database layer
- [x] Prisma installed, `DATABASE_URL` wired
- [x] `schema.prisma` matches `architecture.md` §4 exactly
- [x] Initial migration run
- [x] Seed script (stations + trains fixture data)
- [x] `shared/prisma/client.ts` singleton

### Phase 2 — Redis & event bus plumbing
- [x] `shared/redis/client.ts`
- [x] `shared/events/bus.ts` (typed publish/subscribe)
- [x] `rateLimit.middleware.ts`
- [x] `error.middleware.ts` + `AppError`

### Phase 3 — Auth domain
- [x] `auth.repository.ts`
- [x] `otp.service.ts` (generate, rate-limit)
- [x] reCAPTCHA v3 server verification
- [x] Google OAuth strategy
- [x] JWT issuance/refresh/revoke
- [x] Routes wired
- [x] `auth.middleware.ts`
- [x] `user.registered` event on first login

### Phase 4 — Users domain
- [x] `GET/PATCH /users/me`
- [x] `SavedPassenger` CRUD
- [x] Auto-create profile on `user.registered`

### Phase 5 — Search domain
- [x] `search.repository.ts` interface + fixture implementation
- [x] Search result Redis caching (60s TTL)
- [x] Fare calc placeholder
- [x] Routes wired

### Phase 6 — Booking domain
- [ ] `POST /booking/hold` (seat lock)
- [ ] `PATCH /booking/{id}/passengers`
- [ ] `GET /booking/{id}`, `GET /booking/my`, `POST /booking/{id}/cancel`
- [ ] `payment.captured` subscriber → confirm + PNR
- [ ] `payment.failed` subscriber → expire
- [ ] Stale-hold cleanup job

### Phase 7 — Payment domain
- [ ] `razorpay.client.ts`
- [ ] `POST /payment/order`
- [ ] `POST /payment/webhook` (raw body + signature verify)
- [ ] Refund flow on `booking.cancelled`

### Phase 8 — Notification domain
- [ ] `twilio.client.ts`, `resend.client.ts`
- [ ] `otp.requested` subscriber
- [ ] `booking.confirmed` subscriber
- [ ] `booking.cancelled` / `payment.failed` subscribers
- [ ] `MessageLog` writes

### Phase 9 — Frontend
- [ ] Layout (`Header`, `Footer`, `PromoBanner`)
- [ ] `AuthModal`
- [ ] Home page (hero, search widget, filters, trust tiles, FAQ)
- [ ] Search results page
- [ ] Booking page (passenger form + fare summary)
- [ ] Payment page (Razorpay checkout)
- [ ] Confirmation page
- [ ] PNR status / live status pages
- [ ] My bookings page

### Phase 10 — Integration pass
- [ ] Happy path clean-DB run
- [ ] Failure paths (OTP, seat conflict, payment failure, webhook tamper, cancellation/refund)
- [ ] Response shape audit
- [ ] Secret-leak grep

### Phase 11 — Hardening
- [ ] Security checklist re-verified
- [ ] Security headers + CORS allow-list
- [ ] Structured logging with `requestId`
- [ ] `/search/trains` cache sanity check

### Phase 12 — Deployment prep
- [ ] Production Dockerfiles
- [ ] `DEPLOY.md` written
- [ ] `EMAIL_FROM` switched to domain-verified sender

---

## 4. Environment & credentials status

> Track rotation/setup status here — don't put actual secret values in this file.

| Credential | Rotated since chat exposure? | Configured in local `.env`? | Configured in prod secrets manager? |
|---|---|---|---|
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ☐ | ☐ | ☐ |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ☐ | ☐ | ☐ |
| `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` | ☐ | ☐ | ☐ |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | ☐ | ☐ | ☐ |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | ☐ | ☐ | ☐ |
| `RESEND_API_KEY` / `EMAIL_FROM` | ☐ | ☐ | ☐ |

---

## 5. Known issues / tech debt

*(running list — add as discovered, remove when resolved, don't just silently fix and forget to note it)*

-

---

## 6. Open decisions carried over from build-plan.md

*(pointer only — the actual decisions log lives in `build-plan.md`'s Decisions section; note here if one needs revisiting)*

-

---

## 7. Session log

*(append a new entry every session, oldest first — never delete or rewrite past entries)*

### 2026-08-04 — Planning
- Produced all planning docs: `TrainTravel-Project-Prompt.md`, `architecture.md`, `build-plan.md`, `code-standards.md`, `library-docs.md`, `progress-tracker.md`.
- No code written yet.
- **Next session should start:** Phase 0 (repo & tooling scaffold).
- **Reminder carried forward:** rotate all credentials shared in the original chat before wiring them into any real `.env` file.

### 2026-08-04 — Phase 0: Repo & tooling scaffold
- What was done: Initialized monorepo with `apps/api` (Express + TS + Zod env validation + `/health`) and `apps/web` (Next.js + TS + Tailwind with custom tokens), created `.env.example`, `.gitignore`, `docker-compose.yml` (Postgres 16, Redis 7, API).
- Definition of Done check: pass (`apps/api` and `apps/web` compile cleanly with 0 errors).
- Blockers encountered: None.
- Decisions made: Monorepo uses npm workspaces (`"workspaces": ["apps/*"]`).
- Next session should start: Phase 1 (Database layer - Prisma setup & schema migrations).

### 2026-08-04 — Phase 1: Database layer
- What was done: Installed `@prisma/client` and `prisma` in `apps/api`, authored `prisma/schema.prisma` with 6 domain schemas (`auth`, `users`, `search`, `booking`, `payment`, `notification`), generated Prisma Client, created seed script `prisma/seed.ts` (10 stations, 5 trains), created singleton `shared/prisma/client.ts`.
- Definition of Done check: pass (`npm run build:api` compiles cleanly with generated Prisma types).
- Blockers encountered: None.
- Decisions made: `multiSchema` preview feature enabled in Prisma schema for domain separation.
- Next session should start: Phase 2 (Redis & event bus plumbing).

### 2026-08-04 — Phase 2: Redis & event bus plumbing
- What was done: Built `shared/redis/client.ts`, `shared/events/types.ts` & `bus.ts` (typed Pub/Sub), `AppError.ts`, `error.middleware.ts`, `rateLimit.middleware.ts`.
- Definition of Done check: pass (`npm run build:api` compiles cleanly).
- Blockers encountered: None.
- Next session should start: Phase 3 (Auth domain).

### 2026-08-04 — Phase 3: Auth domain
- What was done: Implemented 4-layer Auth domain (`auth.repository.ts`, `otp.service.ts`, `recaptcha.service.ts`, `jwt.service.ts`, `auth.service.ts`, `google-oauth.service.ts`, `auth.controller.ts`, `auth.routes.ts`, `auth.middleware.ts`), wired cookie-parser & passport in `main.ts`, published `otp.requested` & `user.registered` events.
- Definition of Done check: pass (`npm run build:api` compiles cleanly with 0 errors).
- Blockers encountered: None.
- Decisions made: Refresh tokens hashed with SHA-256 before saving to DB and stored in httpOnly `refreshToken` cookie.
- Next session should start: Phase 4 (Users domain).

### 2026-08-04 — Phase 4: Users domain
- What was done: Implemented Users domain (`users.repository.ts`, `users.service.ts`, `users.controller.ts`, `users.routes.ts`, `users.events.ts`), wired profile read/update (`GET/PATCH /users/me`), saved passengers CRUD (`GET/POST/DELETE /users/passengers`), and auto-create profile subscriber on `user.registered`.
- Definition of Done check: pass (`npm run build:api` compiles cleanly with 0 errors).
- Blockers encountered: None.
- Next session should start: Phase 5 (Search domain - fixture-backed).

### 2026-08-04 — Phase 5: Search domain (fixture-backed)
- What was done: Implemented Search domain (`search.repository.ts`, `search.service.ts`, `search.controller.ts`, `search.routes.ts`), added station autocomplete, train search between stations with 60s Redis caching (`search:{from}:{to}:{date}`), class-based fare calculation (`SL`, `3A`, `2A`, `1A`), PNR status lookup, and live train status lookup.
- Definition of Done check: pass (`npm run build:api` compiles cleanly with 0 errors).
- Blockers encountered: None.
- Decisions made: Search results cached in Redis for 60 seconds using key pattern `search:{from}:{to}:{date}`.
- Next session should start: Phase 6 (Booking domain).

---

*Template for future entries:*
```
### YYYY-MM-DD — Phase N: <short description>
- What was done:
- Definition of Done check: pass / fail (details if fail)
- Blockers encountered:
- Decisions made (also add to build-plan.md Decisions log if durable):
- Next session should start:
```