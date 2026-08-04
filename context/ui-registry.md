# ui-registry.md — TrainTravel

> Single source of truth for every reusable UI component. `TrainTravel-Project-Prompt.md` §2 describes the *pages* in prose; this file specifies the *components* those pages are built from — props, states, and where each one is used — so the same `TrainResultCard` or `Button` isn't reinvented three different ways across the app. Pair with `code-standards.md` §9 for the frontend coding rules these components must follow.

---

## 1. Design tokens

Define these once in `tailwind.config.ts` under `theme.extend` — no component may use a raw hex value, arbitrary spacing number, or ad-hoc shadow outside this set.

```ts
// tailwind.config.ts (theme.extend excerpt)
colors: {
  brand: {
    50: '#eef2ff', 100: '#e0e7ff', 500: '#4f46e5', 600: '#4338ca',
    700: '#3730a3', 900: '#1e3a8a', // primary indigo
  },
  accent: {
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', // amber accent
  },
  status: {
    confirmed: '#16a34a', // green
    rac: '#d97706',       // amber
    waitlist: '#dc2626',  // red
  },
  neutral: { 50: '#f9fafb', 100: '#f3f4f6', 500: '#6b7280', 900: '#111827' },
},
borderRadius: { card: '16px', chip: '9999px', input: '10px' },
boxShadow: { card: '0 2px 8px rgba(17,24,39,0.06)', cardHover: '0 6px 20px rgba(17,24,39,0.10)' },
fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
```

**Type scale:** `text-3xl font-bold` (page H1) → `text-xl font-semibold` (section headers) → `text-base` (body) → `text-sm text-neutral-500` (helper/meta text).

**Icons:** `lucide-react` exclusively — no mixed icon libraries, no inline SVGs for anything that has a lucide equivalent.

---

## 2. Component catalog (index)

| Component | Path | Category |
|---|---|---|
| `Button` | `components/ui/Button.tsx` | Primitive |
| `Input` | `components/ui/Input.tsx` | Primitive |
| `Card` | `components/ui/Card.tsx` | Primitive |
| `Chip` | `components/ui/Chip.tsx` | Primitive |
| `Badge` | `components/ui/Badge.tsx` | Primitive |
| `Modal` | `components/ui/Modal.tsx` | Primitive |
| `Dropdown` | `components/ui/Dropdown.tsx` | Primitive |
| `Accordion` | `components/ui/Accordion.tsx` | Primitive |
| `Spinner` | `components/ui/Spinner.tsx` | Primitive |
| `Header` | `components/layout/Header.tsx` | Layout |
| `Footer` | `components/layout/Footer.tsx` | Layout |
| `PromoBanner` | `components/layout/PromoBanner.tsx` | Layout |
| `AuthModal` | `components/auth/AuthModal.tsx` | Auth |
| `OtpInput` | `components/auth/OtpInput.tsx` | Auth |
| `GoogleSignInButton` | `components/auth/GoogleSignInButton.tsx` | Auth |
| `SearchWidgetCard` | `components/search/SearchWidgetCard.tsx` | Search |
| `StationAutocomplete` | `components/search/StationAutocomplete.tsx` | Search |
| `DateChipPicker` | `components/search/DateChipPicker.tsx` | Search |
| `QuickFilterChips` | `components/search/QuickFilterChips.tsx` | Search |
| `ClassQuotaDropdowns` | `components/search/ClassQuotaDropdowns.tsx` | Search |
| `TrustBadgeRow` | `components/home/TrustBadgeRow.tsx` | Home |
| `TrainEnquiryCards` | `components/home/TrainEnquiryCards.tsx` | Home |
| `PopularRoutesGrid` | `components/home/PopularRoutesGrid.tsx` | Home |
| `FaqAccordionSection` | `components/home/FaqAccordionSection.tsx` | Home |
| `FilterSidebar` | `components/results/FilterSidebar.tsx` | Results |
| `SortBar` | `components/results/SortBar.tsx` | Results |
| `TrainResultCard` | `components/results/TrainResultCard.tsx` | Results |
| `ClassAvailabilityChip` | `components/results/ClassAvailabilityChip.tsx` | Results |
| `StepIndicator` | `components/booking/StepIndicator.tsx` | Booking |
| `PassengerForm` | `components/booking/PassengerForm.tsx` | Booking |
| `FareSummaryCard` | `components/booking/FareSummaryCard.tsx` | Booking |
| `RazorpayCheckoutButton` | `components/payment/RazorpayCheckoutButton.tsx` | Payment |
| `TicketSummaryCard` | `components/confirmation/TicketSummaryCard.tsx` | Confirmation |
| `ShareTicketButtons` | `components/confirmation/ShareTicketButtons.tsx` | Confirmation |
| `BookingListItem` | `components/bookings/BookingListItem.tsx` | My Bookings |
| `PnrLookupForm` | `components/enquiry/PnrLookupForm.tsx` | Enquiry |
| `LiveStatusLookupForm` | `components/enquiry/LiveStatusLookupForm.tsx` | Enquiry |

---

## 3. Primitives

### `Button`
```ts
type ButtonProps = {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  onClick?: () => void;
  children: React.ReactNode;
};
```
- `primary` = solid `bg-brand-600`, white text — main CTAs ("Search Trains", "Pay Now").
- `loading` swaps children for `Spinner` and disables the click handler — never disable without a visible loading state.

### `Input`
```ts
type InputProps = {
  label?: string;
  error?: string;
  icon?: LucideIcon;
} & React.InputHTMLAttributes<HTMLInputElement>;
```
- Error state renders `border-status-waitlist` + `error` text below in `text-sm text-status-waitlist`.

### `Card`
```ts
type CardProps = { padded?: boolean; hoverable?: boolean; children: React.ReactNode };
```
- Base: `rounded-card shadow-card bg-white`. `hoverable` adds `hover:shadow-cardHover transition-shadow`.

### `Chip`
```ts
type ChipProps = { selected?: boolean; onClick?: () => void; children: React.ReactNode };
```
- Pill-shaped (`rounded-chip`), used for quick filters and date selection. Selected state: `bg-brand-600 text-white`; default: `bg-neutral-100 text-neutral-900`.

### `Badge`
```ts
type BadgeProps = { tone: 'confirmed' | 'rac' | 'waitlist' | 'neutral'; children: React.ReactNode };
```
- Small status label, e.g. "CONFIRMED", "RAC", "WL 12" — background tint of the matching `status.*` token at 10% opacity, text at full tone color.

### `Modal`, `Dropdown`, `Accordion`, `Spinner`
- Standard headless-pattern primitives (no third-party UI kit) — `Modal` traps focus and closes on `Escape`/backdrop click; `Accordion` supports single- or multi-open via a `mode` prop; `Dropdown` is used for Class/Quota selects.

---

## 4. Layout components

### `Header`
```ts
type HeaderProps = { user: { name?: string } | null; onLoginClick: () => void };
```
- Sticky top, logo left, nav links center (`Book Train Tickets`, `Check PNR Status`, `Live Train Status`, `Seat Availability`), right side shows `Button variant="ghost"` "Login" when `user` is null, or a user avatar/menu when logged in.

### `Footer`
- Static, no props. 4-column layout per `TrainTravel-Project-Prompt.md` §2.1: Features / Book with Us / Info / Company legal block + social icons.

### `PromoBanner`
```ts
type PromoBannerProps = { message: string; onDismiss: () => void };
```
- Dismissible slim banner above the header; dismissal state held in the parent layout (session-only, not persisted).

---

## 5. Auth components

### `AuthModal`
```ts
type AuthModalProps = { open: boolean; onClose: () => void; onSuccess: (user: User) => void };
```
- Two tabs: "Email/Phone" and "Google". Internal step state: `enter-target → otp-sent → verifying`. Calls `/auth/otp/request` then `/auth/otp/verify` via `lib/api-client.ts`. reCAPTCHA v3 token generated invisibly on the "Send OTP" click, attached to the request.

### `OtpInput`
```ts
type OtpInputProps = { length?: number; onComplete: (code: string) => void; resendSeconds: number; onResend: () => void };
```
- 6 individual boxes (default `length=6`), auto-advances focus, shows a "Resend OTP in {n}s" countdown that becomes a clickable "Resend" once it hits 0.

### `GoogleSignInButton`
```ts
type GoogleSignInButtonProps = { onClick: () => void };
```
- Redirects to `GET /auth/google`. Google "G" icon + "Continue with Google" label, white background with neutral border per Google's brand guidelines.

---

## 6. Search components (home page)

### `SearchWidgetCard`
```ts
type SearchWidgetCardProps = {
  onSearch: (params: SearchParams) => void;
};
type SearchParams = { from: string; to: string; date: string; travelClass?: string; quota?: string };
```
- Composes `StationAutocomplete` ×2 (with swap icon between), `DateChipPicker`, `QuickFilterChips`, `ClassQuotaDropdowns`, and a primary `Button` "Search Trains". This is the hero centerpiece described in `TrainTravel-Project-Prompt.md` §2.2 — matches RailYatri's From/To/date-chip layout.

### `StationAutocomplete`
```ts
type StationAutocompleteProps = { value: string; onChange: (stationCode: string) => void; placeholder: string; excludeCode?: string };
```
- Debounced (300ms) call to `GET /search/stations?q=`, dropdown list of matches (code + name + city). `excludeCode` prevents selecting the same station as its paired From/To field.

### `DateChipPicker`
```ts
type DateChipPickerProps = { value: string; onChange: (isoDate: string) => void; daysAhead?: number };
```
- Horizontal scroll of date chips (default next 5 days), each showing day-of-month + weekday, matching the "30 Jul Thu / 31 Jul Fri" pattern from RailYatri.

### `QuickFilterChips`
```ts
type QuickFilterChipsProps = { selected: string[]; onChange: (selected: string[]) => void };
```
- Multi-select `Chip` row: `AC Only`, `Confirmed Seats`, `Morning Departure (06:00–12:00)`, `Ladies Quota`.

### `ClassQuotaDropdowns`
```ts
type ClassQuotaDropdownsProps = { travelClass: string; quota: string; onChange: (field: 'class' | 'quota', value: string) => void };
```

---

## 7. Home-page sections

### `TrustBadgeRow`
- Static grid of icon+text tiles (High Booking Success, 24/7 Support, Reliable Live Tracking, Instant Auto-Refunds, etc.) — no props, content is a local constant array, not fetched.

### `TrainEnquiryCards`
- Two prominent cards: "Live Train Status" → links to `/live-train-status`, "PNR Status" → links to `/pnr-status`.

### `PopularRoutesGrid`
```ts
type PopularRoutesGridProps = { routes: { from: string; to: string; fromCode: string; toCode: string }[] };
```
- Chip/link grid for SEO + quick access, prefills `SearchWidgetCard` via query params on click.

### `FaqAccordionSection`
```ts
type FaqAccordionSectionProps = { items: { question: string; answer: string }[] };
```
- Wraps `Accordion` primitive; content is static local data (booking how-to, Tatkal timing, RAC/GNWL/PQWL/RLWL/TQWL glossary, refund tracking — per `TrainTravel-Project-Prompt.md` §2.2).

---

## 8. Results-page components

### `FilterSidebar`
```ts
type FilterSidebarProps = { filters: ResultFilters; onChange: (filters: ResultFilters) => void };
type ResultFilters = { departureRange?: [number, number]; classes: string[]; quota?: string; acOnly?: boolean };
```
- Sticky left sidebar: departure-time range slider, class checkboxes, quota select, AC/non-AC toggle.

### `SortBar`
```ts
type SortBarProps = { sortBy: 'departure' | 'duration' | 'price'; onChange: (sortBy: string) => void };
```

### `TrainResultCard`
```ts
type TrainResultCardProps = {
  trainNumber: string;
  trainName: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  runningDays: string[];
  classes: { code: string; price: number; availability: AvailabilityStatus; confirmationProbability?: 'high' | 'medium' | 'low' }[];
  onSelectClass: (classCode: string) => void;
};
type AvailabilityStatus = { type: 'AVAILABLE' | 'RAC' | 'WAITLIST'; count?: number };
```
- One card per train; horizontal row of `ClassAvailabilityChip` inside, matching the class-wise price/availability layout from `TrainTravel-Project-Prompt.md` §2.3.

### `ClassAvailabilityChip`
```ts
type ClassAvailabilityChipProps = { classCode: string; price: number; availability: AvailabilityStatus; confirmationProbability?: 'high' | 'medium' | 'low'; onClick: () => void };
```
- Uses `Badge` tone mapping: `AVAILABLE → confirmed`, `RAC → rac`, `WAITLIST → waitlist`. Confirmation-probability shown as a small secondary badge on waitlisted classes only.

**States for this whole page:** loading (skeleton `TrainResultCard`s, not a spinner blocking the whole page), empty ("No trains found for this route/date — try adjusting your filters"), error (retry-able inline message, not a full-page crash).

---

## 9. Booking-flow components

### `StepIndicator`
```ts
type StepIndicatorProps = { steps: string[]; currentStep: number };
```
- `Train & Class → Passenger Details → Review → Payment → Confirmation`, per `TrainTravel-Project-Prompt.md` §2.4.

### `PassengerForm`
```ts
type PassengerFormProps = {
  maxPassengers: number; // 6 normal, 4 if quota === 'TATKAL'
  savedPassengers: SavedPassenger[];
  contactEmail: string;
  contactPhone: string;
  onSubmit: (data: { passengers: Passenger[]; contactEmail: string; contactPhone: string }) => void;
};
```
- Built with `react-hook-form` + `zod` per `code-standards.md` §9. Contact fields pre-filled from the logged-in user's profile, editable. "Add from saved passengers" quick-select if `savedPassengers` is non-empty.

### `FareSummaryCard`
```ts
type FareSummaryCardProps = { baseFare: number; convenienceFee: number; gst: number; total: number };
```
- Sticky on the right of the booking page, per the design doc.

---

## 10. Payment component

### `RazorpayCheckoutButton`
```ts
type RazorpayCheckoutButtonProps = { bookingId: string; onSuccess: () => void; onFailure: (reason: string) => void };
```
- Calls `POST /payment/order`, then opens the Razorpay Checkout script (per `library-docs.md` frontend section) using the returned `keyId` + `orderId`. Never marks anything confirmed itself — only navigates to a "processing" state and polls `GET /booking/{id}` until the webhook-driven status change lands.

---

## 11. Confirmation & bookings components

### `TicketSummaryCard`
```ts
type TicketSummaryCardProps = { pnr: string; trainName: string; classCode: string; passengers: Passenger[]; journeyDate: string; status: 'CONFIRMED' | 'RAC' | 'WAITLISTED' };
```

### `ShareTicketButtons`
```ts
type ShareTicketButtonsProps = { pnr: string; downloadUrl: string };
```
- "Download PDF", "Share via WhatsApp", "Email ticket" actions.

### `BookingListItem`
```ts
type BookingListItemProps = { booking: Booking; onCancel: (id: string) => void };
```
- Used on `/my-bookings`; shows a `Badge` for status, a `Button variant="danger"` "Cancel" only when `status` is cancellable.

---

## 12. Enquiry components

### `PnrLookupForm` / `LiveStatusLookupForm`
```ts
type PnrLookupFormProps = { onSubmit: (pnr: string) => void };
type LiveStatusLookupFormProps = { onSubmit: (trainNumber: string) => void };
```
- Simple single-field forms feeding `/search/pnr/{pnr}` and `/search/live-status/{trainNumber}` respectively.

---

## 13. Cross-cutting rules

- **Every** data-driven component has explicit `loading`, `error`, and `empty` visual states — no silent blank renders (`code-standards.md` §9).
- No component fetches data itself except via `lib/api-client.ts`, and only page-level (`app/*/page.tsx`) or a dedicated container component may own that call — presentational components in this registry receive data via props, they don't fetch.
- Any new component not listed here gets added to §2's index table in the same PR that introduces it — this file must stay exhaustive, not aspirational.

---

*Update this file whenever a component's props change or a new one is added — treat it as the contract other components and pages are written against.*