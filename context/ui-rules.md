# ui-rules.md — TrainTravel

> `ui-registry.md` defines *what each component is* (props, states). This file defines *the rules every component and page must follow* — spacing, responsiveness, interaction states, accessibility, copy tone, motion. Treat violations of this file the same as a lint error, not a style preference.

---

## 1. Layout & responsive breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| `sm` | ≥640px | Mobile landscape / large phones |
| `md` | ≥768px | Tablet — `SearchWidgetCard` and `FilterSidebar` still stack |
| `lg` | ≥1024px | Desktop — sidebar + results go side-by-side, header nav links appear inline |
| `xl` | ≥1280px | Max content width caps at `1280px`, centered, with `px-6` gutters below that |

**Rules:**
- Design mobile-first: base Tailwind classes target mobile, override upward with `md:`/`lg:` prefixes — never the reverse.
- Every page must be fully usable at 375px width (iPhone SE class) with no horizontal scroll except intentional horizontal-scroll regions (`DateChipPicker`, `PopularRoutesGrid`).
- `FilterSidebar` on the results page collapses into a slide-up sheet (triggered by a "Filters" button) below `lg`, not a squeezed sidebar.
- `Header` nav links collapse into a hamburger/drawer below `lg`; `Login` button always stays visible regardless of breakpoint.

---

## 2. Spacing system

Base unit: **4px**. Only use Tailwind's default scale (`1`=4px, `2`=8px, `3`=12px, `4`=16px, `6`=24px, `8`=32px, `12`=48px, `16`=64px) — no arbitrary values like `p-[13px]`.

| Context | Spacing |
|---|---|
| Inside a `Card` | `p-4` mobile, `p-6` desktop |
| Between form fields | `gap-4` |
| Between sections on a page | `gap-8` mobile, `gap-12` desktop |
| Between a page edge and content | `px-4` mobile, `px-6` tablet, centered `max-w-7xl` desktop |
| Between chips in a row (`QuickFilterChips`, `DateChipPicker`) | `gap-2` |

---

## 3. Interaction states

Every interactive element (button, chip, input, card-as-link, dropdown) must visibly implement **all** of these unless explicitly not applicable:

| State | Rule |
|---|---|
| Default | As specified in `ui-registry.md` |
| Hover (pointer devices only) | Subtle — `hover:shadow-cardHover` for cards, slight `hover:bg-*` shift for buttons/chips. Never rely on hover alone to convey information (touch devices don't have it). |
| Focus-visible | A visible outline/ring (`focus-visible:ring-2 focus-visible:ring-brand-500`) on every focusable element — never `outline-none` without replacing it with a custom visible focus style. This applies to keyboard nav, not mouse clicks (`:focus-visible`, not `:focus`). |
| Active/pressed | Slight scale or darken (`active:scale-[0.98]` for buttons) — gives tactile feedback on tap. |
| Disabled | `opacity-50 cursor-not-allowed`, and the element is genuinely inert (no click handler fires) — never fake-disable with just styling. |
| Loading | Button `loading` state per `ui-registry.md` §3 — spinner replaces label, element is disabled while loading, and the label text is preserved in an `aria-label` so screen readers still announce what's loading. |

**Touch targets:** minimum 44×44px hit area on any tappable element, even if the visual element is smaller (pad with invisible margin/padding rather than shrinking the tap zone) — this matters most for `Chip`, close icons on `PromoBanner`, and `OtpInput` boxes.

---

## 4. Loading, empty, and error states — required pattern

Every data-driven view in the app must implement all three, not just the happy path:

- **Loading:** skeleton placeholders that match the real content's shape (e.g. skeleton `TrainResultCard`s on the results page), not a full-page spinner that blocks the whole layout. A full-page spinner is only acceptable for the very first paint of an entire page (e.g. before the shell itself is ready).
- **Empty:** a specific, actionable message — never a blank area. E.g. "No trains found for this route on this date — try a nearby date or adjust filters," with a CTA (clear filters / change date) when one makes sense.
- **Error:** an inline, retry-able message near the affected content, not a full-page crash or a raw error dump. E.g. "Couldn't load trains — [Retry]." Only navigation-breaking errors (e.g. an invalid deep link) warrant a dedicated error page.

Toasts (non-blocking, top-right on desktop / top on mobile, auto-dismiss after 4s, dismissible early) are used for background/async confirmations that don't block the current task — e.g. "Booking cancelled," "OTP resent." They are **not** used for anything the user needs to act on before proceeding (that's a `Modal` or inline message instead).

---

## 5. Forms & validation UX

- Validate on blur and on submit — not on every keystroke (avoid punishing the user while they're still typing).
- Error messages are specific and instructive: "Enter a valid 10-digit phone number," not "Invalid input."
- Never disable a submit button as the primary way of blocking invalid submission — attempt the submit, show inline errors, and scroll/focus to the first invalid field. (Disabled submit buttons are frequently invisible to users as to *why* they're disabled.)
- Required fields are marked with a subtle `*`, not color alone (colorblind-safe).
- `PassengerForm` and any multi-row form: each row is independently deletable/editable, and adding a row never clears already-entered data in other rows.
- OTP resend: `OtpInput`'s resend countdown must be visually obvious (not just a disabled link with no explanation) — show "Resend OTP in 0:45."

---

## 6. Motion & transitions

- Standard transition: `transition-all duration-200 ease-out` for hover/focus/active state changes.
- Page-level transitions (route changes) are instant — no full-page fade/slide that delays perceived load time.
- `Modal` and slide-up filter sheets animate in over `duration-300 ease-out`, animate out over `duration-200 ease-in` (exit faster than entry — standard motion convention).
- Respect `prefers-reduced-motion`: wrap non-essential animation (decorative, not state-communicating) in a media query check and skip it for users who've opted out. Functional transitions (modal open/close) can stay but should shorten, not disappear entirely, since they also convey state change.

---

## 7. Accessibility (WCAG 2.1 AA baseline)

- Color contrast: body text ≥4.5:1, large text/UI components ≥3:1 against their background — verify `status.*` badge colors against their tint backgrounds specifically, since amber/green/red on light tints is a common contrast failure point.
- Every `<img>` and icon-only button has meaningful `alt`/`aria-label` text — decorative images use `alt=""`.
- All interactive flows (search, booking, payment, auth) must be fully completable via keyboard alone — tab order follows visual/logical order, no keyboard traps in `Modal`.
- Form inputs have associated `<label>` elements (via `Input`'s `label` prop, not placeholder-as-label — placeholders disappear on input and are not a substitute for a label).
- Status changes that aren't visually obvious to all users (e.g. seat availability updating, OTP verified) get an `aria-live="polite"` region so screen reader users are notified too.
- `DateChipPicker` and other custom selection widgets expose proper ARIA roles (`radiogroup`/`radio` pattern) rather than being a `div` soup with only visual selection state.

---

## 8. Copy & microcopy conventions

- Tone: clear, direct, reassuring — RailYatri-style confidence ("Book in 2 minutes," "Full refund on cancellation") without overclaiming anything TrainTravel doesn't actually guarantee yet.
- Buttons are verbs: "Search Trains," "Pay Now," "Cancel Booking" — never a bare "Submit" or "OK" where a specific action label is possible.
- Error copy never blames the user ("You entered it wrong") — states the fix instead ("Enter a valid PNR number").
- Numbers: currency always as `₹1,234` (no decimals for whole-rupee amounts, comma-grouped per Indian numbering — `₹1,00,000` not `₹100,000` for amounts over one lakh where relevant).
- Dates: `30 Jul, Thu` short form in compact UI (chips, cards), `30 July 2026` full form in confirmations/tickets/emails.
- Times: 24-hour or 12-hour with AM/PM — pick 12-hour with AM/PM (matches RailYatri and general Indian consumer-app convention) and use it everywhere, never mixed.

---

## 9. Iconography

- `lucide-react` only, per `ui-registry.md` §1 — one visual weight/style throughout.
- Icon size pairs with text size: `16px` icon next to `text-sm`, `20px` next to `text-base`, `24px` for standalone icon buttons.
- Status icons carry consistent meaning app-wide: a filled circle-check = confirmed/success, a triangle-alert = warning/RAC, a circle-x = error/waitlist-failed — don't reuse a shape for a different meaning elsewhere in the app.

---

## 10. Mobile-specific rules

- Primary CTA on any form-heavy mobile screen (booking, payment) stays reachable in the thumb zone — sticky bottom bar with the CTA (e.g. "Continue" / "Pay ₹1,234") rather than requiring a scroll to the bottom of a long form.
- Use a bottom sheet (slide up from bottom) instead of a centered `Modal` for mobile — `AuthModal` and the filter sheet both follow this: centered modal on `lg+`, bottom sheet below `lg`.
- No hover-dependent functionality anywhere (see §3) — everything must have a tap-equivalent.

---

## 11. Z-index scale

Use this fixed scale — never an arbitrary z-index number:

| Layer | z-index |
|---|---|
| Base content | `z-0` |
| Sticky header / sticky fare summary | `z-10` |
| Dropdown / autocomplete panel | `z-20` |
| PromoBanner (above header when both present) | `z-30` |
| Toast notifications | `z-40` |
| Modal / bottom sheet + backdrop | `z-50` |

---

## 12. Images & assets

- All images served with explicit `width`/`height` (or Next.js `<Image>` with fill + sized container) to prevent layout shift.
- No image is the sole carrier of information required to complete a task — anything an image conveys (e.g. a train-class diagram) has a text equivalent nearby.

---

## 13. Consistency checklist (apply before considering any page "done")

- [ ] Works at 375px width with no unintended horizontal scroll.
- [ ] Every interactive element has visible hover, focus-visible, active, and (if applicable) disabled states.
- [ ] Every data-driven section has loading, empty, and error states implemented, not just the happy path.
- [ ] All colors/spacing/radii come from the tokens in `ui-registry.md` §1 — no raw hex or arbitrary px values.
- [ ] Fully keyboard-navigable, labels present on all form fields, contrast checked on any new color combination.
- [ ] Copy follows §8 (verb-labeled buttons, instructive errors, consistent date/time/currency formatting).