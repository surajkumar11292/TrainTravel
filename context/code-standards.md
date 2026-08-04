# code-standards.md — TrainTravel

> Conventions every file in this repo must follow, human or agent-written. Pair this with `architecture.md` (structure/contracts) and `build-plan.md` (sequence). If a generated file violates something here, it should be treated as a bug, not a style nitpick.

---

## 1. Language & tooling baseline

- **TypeScript everywhere**, `strict: true` in every `tsconfig.json`. No `any` — use `unknown` and narrow it, or define a proper type. If you're tempted to write `any`, that's a signal the type belongs in a shared `types/` file instead.
- **ESLint + Prettier**, one shared root config extended by both `apps/api` and `apps/web`. Prettier controls formatting; ESLint controls correctness/style rules. Never hand-format against what Prettier would produce.
- **Node LTS** version pinned in `.nvmrc`; CI and Docker images use the same version.
- Package manager: pick one (`pnpm` recommended for workspaces) and commit its lockfile only — never mix lockfiles.
- No default exports for anything except Next.js page/layout files (which require them). Everything else uses named exports — makes refactors and auto-imports predictable.

---

## 2. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case`, suffix states its role | `auth.service.ts`, `booking.repository.ts`, `TrainResultCard.tsx` |
| React components | `PascalCase`, filename matches component name | `SearchWidgetCard.tsx` exports `SearchWidgetCard` |
| Variables / functions | `camelCase` | `getBookingById` |
| Types / interfaces | `PascalCase`, no `I` prefix | `Booking`, `CreateBookingInput` |
| Constants (true constants) | `UPPER_SNAKE_CASE` | `MAX_PASSENGERS_PER_BOOKING` |
| Env var names | `UPPER_SNAKE_CASE`, matches `.env.example` exactly | `JWT_ACCESS_SECRET` |
| Redis keys | `lowercase:colon:separated`, matches `architecture.md` §5 exactly | `seatlock:{train}:{date}:{class}:{userId}` |
| Event names | `domain.past_tense_event`, matches `architecture.md` §6 exactly | `booking.confirmed`, `payment.failed` |
| DB tables (Prisma models) | `PascalCase` singular | `Booking`, `Passenger` |
| API routes | `kebab-case`, plural nouns, matches `architecture.md` §11 exactly | `/booking/{id}/passengers` |

Never invent a new event name, Redis key pattern, or route that isn't already in `architecture.md` — update that file first, then implement, so it stays the source of truth.

---

## 3. Layering rules (backend)

Every domain follows the same four-file shape from `architecture.md` §3. These boundaries are hard rules, not suggestions:

| Layer | May contain | Must never contain |
|---|---|---|
| `*.routes.ts` | route → controller wiring only | any logic |
| `*.controller.ts` | parse `req`, call service, shape `res` | Prisma calls, business rules |
| `*.service.ts` | business logic, orchestration, event publishing | `req`/`res` objects, direct Prisma calls |
| `*.repository.ts` | Prisma queries only | business logic, HTTP concerns |

A service method should be testable by calling it directly with plain arguments — if you can't unit test a service function without spinning up Express, the layering is wrong.

**Cross-domain calls:** a domain may call another domain's `*.service.ts` function directly **only** for synchronous reads that the user is waiting on (e.g. booking re-checking search availability). Anything that changes state in another domain happens via the event bus (`architecture.md` §6), never a direct cross-domain write call.

---

## 4. API & response conventions

- Every endpoint returns the single shape defined in `architecture.md` §12:
  ```ts
  { success: true, data: T } | { success: false, error: { code: string, message: string } }
  ```
- HTTP status codes are meaningful: `400` validation, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict (e.g. seat lock already held), `422` semantically invalid input, `5xx` unexpected server error. Don't return `200` with an error payload.
- Validate every request body/query with a schema library (`zod` recommended) at the controller boundary — services should be able to trust their inputs are already shaped correctly.
- Pagination: `?page=&limit=` query params, response includes `{ data: T[], page, limit, total }`.
- Idempotency: any endpoint that creates a payment or booking record must be safe to retry (e.g. client sends a request id, or the seat-lock key itself prevents duplicates) — see the seat-hold pattern in `architecture.md` §5.

---

## 5. Error handling

- Throw `AppError(code, message, httpStatus)` from services — never throw a raw `Error`, never `res.status().json()` directly from inside a service.
- `error.middleware.ts` is the **only** place that formats an error response. Controllers just `try { } catch (err) { next(err) }` or let async errors bubble via an async-handler wrapper.
- Never swallow an error silently. If a failure is genuinely non-critical (e.g. a notification send failing), log it at `warn` level and continue — don't just `catch {}`.
- Log the full error server-side; never leak stack traces or internal messages to the client — client sees `error.code` + a safe `error.message`.

---

## 6. Async & events

- Use the shared `shared/events/bus.ts` wrapper for every publish/subscribe — never call `redis.publish` directly from a domain file.
- Event payloads are typed (define the payload interface next to the event name in a shared `events/types.ts`) — no untyped `any` payloads.
- Event handlers must be idempotent (safe to process the same event twice) — e.g. re-processing `payment.captured` for an already-`CONFIRMED` booking should be a no-op, not a duplicate PNR.
- Long-running or retryable work (sending SMS/email) lives in `notification`'s event handlers — controllers never block a user-facing request waiting on an external SMS/email API call.

---

## 7. Database & Prisma conventions

- Never call `new PrismaClient()` outside `shared/prisma/client.ts`. Always import the shared instance.
- All schema changes go through `prisma migrate dev --name <descriptive-name>` — no hand-edited SQL against the dev DB.
- Every table has `createdAt`; mutable tables also get `updatedAt` (`@updatedAt`).
- Monetary values are `Decimal`, never `Float` — floating point currency math is a bug class, not a style choice.
- Foreign-key-like references (e.g. `Booking.userId`) are stored as plain fields, not Prisma relations, while domains still share one physical DB — this matches the "schema-per-domain, service boundary in code" approach from `architecture.md` and keeps the door open to splitting DBs later without a relation-mapping rewrite.

---

## 8. Security rules (non-negotiable, lint for these where possible)

- No secret, key, or credential is ever hardcoded — everything flows through `shared/config/env.ts`.
- `.env` is git-ignored; only `.env.example` (names, no values) is committed.
- Razorpay webhook payloads are signature-verified (`RAZORPAY_WEBHOOK_SECRET`) **before** any field of the payload is trusted or parsed.
- OTP endpoints are always behind the Redis rate limiter (`architecture.md` §5) and reCAPTCHA v3 server-side verification — no exceptions for "just testing."
- Access tokens: 15-minute expiry, sent as `Authorization: Bearer`. Refresh tokens: httpOnly + secure + sameSite cookie, never in localStorage or a JS-readable cookie.
- Passwordless auth means no password hashes to worry about — but OTP codes and refresh token hashes still get the same "never log this value" treatment as a password would.
- All user-supplied strings that reach a rendered page (passenger names, contact info) are treated as untrusted — rely on React's default escaping, never `dangerouslySetInnerHTML` with user input.

---

## 9. Frontend conventions (Next.js / React / Tailwind)

- Function components only, no class components.
- One component per file, filename = component name, colocate a component's own small helper types in the same file; shared types go in `lib/types.ts`.
- Data fetching goes through `lib/api-client.ts` only — no component calls `fetch` directly, so token refresh/401 handling stays in one place.
- Tailwind only — no inline `style={{}}` unless a value is truly dynamic/computed at runtime (e.g. a chart width). No new CSS files per component.
- Match the visual language locked in the design doc: rounded 12–16px cards, soft shadows, pill-shaped filter chips, the chosen indigo/amber palette as Tailwind theme tokens (not ad-hoc hex values scattered across components).
- Forms use a schema-based validator (`zod` + `react-hook-form` recommended) — no manual `if (!email) setError(...)` chains.
- Loading and error states are explicit in every data-fetching component — no component that silently renders nothing while a request is in flight.

---

## 10. Testing standards

- Every `*.service.ts` gets a unit test file (`*.service.test.ts`) that calls it directly with mocked repository/event-bus dependencies — no real DB or Redis in unit tests.
- Every domain gets at least one integration test hitting its routes against a real (test) Postgres + Redis via `docker-compose.test.yml` — covers the happy path plus the key failure path (e.g. booking: hold conflict returns 409; payment: bad webhook signature is rejected).
- Test files live next to the file they test (`auth.service.ts` + `auth.service.test.ts` in the same folder), not in a separate mirrored `tests/` tree.
- No test asserts against a real third-party call (Razorpay/Twilio/Resend/Google) — mock the client wrappers (`razorpay.client.ts` etc.) at the boundary.

---

## 11. Logging

- Structured JSON logs only (`pino` recommended) — no bare `console.log` in committed code.
- Every request gets a `requestId` (generated at the gateway, passed through) present on every log line for that request.
- Log levels: `error` (needs attention), `warn` (handled but noteworthy, e.g. notification failure), `info` (normal lifecycle events, e.g. "booking confirmed"), `debug` (dev-only detail, e.g. OTP code — must be stripped/disabled outside `NODE_ENV=development`).
- Never log a full JWT, refresh token, OTP code, or payment credential — log identifiers (`userId`, `bookingId`) instead of the sensitive value itself, except the explicit dev-only OTP debug log called out in `build-plan.md` Phase 3, which must not run when `NODE_ENV=production`.

---

## 12. Git conventions

- Conventional Commits format: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:` — matches the phase-based commit pattern from `build-plan.md`.
- One phase (or one logical unit of work) per commit — no giant "everything" commits.
- No commented-out code blocks committed — delete it, git history has it if needed.
- Branch naming: `phase-{n}-{short-description}` if working in branches, otherwise trunk-based commits directly following the build plan's phase order.

---

## 13. Documentation-in-code

- Every exported function in a `*.service.ts` gets a one-line JSDoc comment stating what it does and any non-obvious side effect (e.g. "publishes `booking.confirmed`").
- Don't comment *what* obvious code does — comment *why* when a choice isn't self-evident (e.g. why a TTL is 600s, why fare calc uses a placeholder formula).
- If an agent makes an implementation decision not already specified in `architecture.md`, it gets recorded in `build-plan.md`'s Decisions log, not just buried in a code comment.

---

*Treat every rule above as enforceable — if ESLint/Prettier can check it, add the rule to the shared config rather than relying on this doc alone.*