# project-overview.md — TrainTravel

> Start here. This is the entry point to the whole doc set — read this first, then jump to whichever file matches what you're about to do.

---

## 1. What this is

**TrainTravel** is an Indian train ticket booking web app, modeled on RailYatri's UI/UX, with one deliberate simplification: users only ever need an **email and phone number** to create an account — no separate IRCTC login is exposed to them — and **login is mandatory before checkout** (no guest booking).

Built as a **modular monolith on day one**, structured so any domain (auth, users, search, booking, payment, notification) can later be extracted into its own microservice behind the API gateway without a rewrite.

---

## 2. Key product decisions

- Auth: email/phone + OTP, or Google OAuth. No password, no exposed IRCTC login.
- Login required before booking — no guest checkout.
- Payments via Razorpay; SMS via Twilio; transactional email via Resend.
- Bot protection on OTP requests via reCAPTCHA v3 (invisible, score-based).
- Real train schedule / live seat data needs a licensed rail-data provider — not solved by any credential in this stack. Development uses fixture data behind the same interface a real provider will fill later (see `architecture.md` §9).

---

## 3. Tech stack at a glance

| Layer | Choice |
|---|---|
| Backend | Node.js + TypeScript, Express, modular monolith → microservice-ready |
| Frontend | Next.js (App Router) + Tailwind CSS |
| Database | PostgreSQL, schema-per-domain, via Prisma |
| Cache / locks / pub-sub | Redis |
| Auth | JWT (access 15m / refresh 7d) + Google OAuth2 + reCAPTCHA v3 |
| Payments | Razorpay |
| SMS | Twilio |
| Email | Resend |
| Local infra | Docker Compose (api + postgres + redis) |

Exact library versions and usage snippets: `library-docs.md`.

---

## 4. Document map

| File | Read this when you need to... |
|---|---|
| **project-overview.md** *(this file)* | Get oriented, or figure out which doc to open next |
| `TrainTravel-Project-Prompt.md` | Understand the product vision and UI/UX in detail (page-by-page, component-by-component, based on RailYatri research) |
| `architecture.md` | Know the technical ground truth — folder structure, DB schema, Redis key patterns, async event catalog, API route table, sequence diagrams for auth and booking→payment→confirmation |
| `build-plan.md` | Know what to build next and in what order — 12 phases, each with a checklist and a Definition of Done gate |
| `code-standards.md` | Know the conventions to follow while writing any file — naming, layering rules, error handling, security rules, testing structure |
| `library-docs.md` | Know the exact API of a third-party library (Razorpay, Twilio, Resend, Prisma, etc.) — pinned versions, correct usage snippets |
| `progress-tracker.md` | Know exactly where the last session left off — current phase, blockers, credential-rotation status, session-by-session log |

**Rule of thumb:** `architecture.md` says *what exists*, `build-plan.md` says *what order to build it in*, `code-standards.md` says *how to write it*, `library-docs.md` says *which exact API to call*, `progress-tracker.md` says *where things actually stand right now*.

---

## 5. Quick start (once Phase 0 of `build-plan.md` is complete)

```bash
git clone <repo>
cd traintravel
cp .env.example .env   # fill in your own rotated credentials — see §6 below
docker compose up
```
- API health check: `curl localhost:4000/health`
- Frontend: `cd apps/web && npm run dev`

---

## 6. Security — read before touching `.env`

The original set of credentials for this project (JWT secrets, Google OAuth secret, Razorpay keys, Twilio auth token, Resend API key) were shared in a chat conversation during planning and must be treated as compromised. **Rotate every one of them in its respective dashboard before putting them in a real `.env` file.** Never commit `.env`. In production, use a secrets manager, not a flat file. Full checklist: `progress-tracker.md` §4, security rules: `code-standards.md` §8.

---

## 7. Current status

See `progress-tracker.md` §1 for the live answer. As of this writing: planning complete, no code written yet — next step is Phase 0 of `build-plan.md`.