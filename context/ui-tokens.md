# ui-tokens.md — TrainTravel

> Canonical, exhaustive design tokens. `ui-registry.md` §1 shows a short excerpt of these for context; **this file is the source of truth** — if the two ever disagree, this file wins, and the excerpt in `ui-registry.md` should be corrected to match. `ui-rules.md` references the breakpoint, z-index, and motion tokens defined here rather than redefining them.

---

## 1. Color tokens

### 1.1 Brand — primary indigo
| Token | Hex | Typical use |
|---|---|---|
| `brand-50` | `#eef2ff` | Selected-chip background, subtle highlights |
| `brand-100` | `#e0e7ff` | Hover background on light surfaces |
| `brand-200` | `#c7d2fe` | Borders on brand-tinted elements |
| `brand-400` | `#818cf8` | Secondary icons/accents |
| `brand-500` | `#4f46e5` | Links, secondary buttons |
| `brand-600` | `#4338ca` | **Primary button background**, primary CTA |
| `brand-700` | `#3730a3` | Primary button hover/active |
| `brand-900` | `#1e3a8a` | Headline text on light backgrounds, dark UI sections |

### 1.2 Accent — amber
| Token | Hex | Typical use |
|---|---|---|
| `accent-400` | `#fbbf24` | Highlight badges, "offer" tags |
| `accent-500` | `#f59e0b` | Secondary CTA, promo banner accent |
| `accent-600` | `#d97706` | Accent hover state |

### 1.3 Status
| Token | Hex | Meaning |
|---|---|---|
| `status-confirmed` | `#16a34a` | Confirmed seat, success, positive confirmation |
| `status-confirmed-bg` | `#dcfce7` | Confirmed badge background (10–15% tint) |
| `status-rac` | `#d97706` | RAC / warning / pending |
| `status-rac-bg` | `#fef3c7` | RAC badge background |
| `status-waitlist` | `#dc2626` | Waitlisted, error, destructive action |
| `status-waitlist-bg` | `#fee2e2` | Waitlist/error badge background |

### 1.4 Neutral (grayscale)
| Token | Hex | Typical use |
|---|---|---|
| `neutral-0` | `#ffffff` | Card/page background |
| `neutral-50` | `#f9fafb` | Page background (off-white), input backgrounds |
| `neutral-100` | `#f3f4f6` | Unselected chip background, dividers-adjacent fill |
| `neutral-200` | `#e5e7eb` | Borders, dividers |
| `neutral-400` | `#9ca3af` | Placeholder text, disabled icon |
| `neutral-500` | `#6b7280` | Secondary/meta text |
| `neutral-700` | `#374151` | Body text |
| `neutral-900` | `#111827` | Headings, primary text |

### 1.5 Semantic aliases
Map raw palette tokens to semantic names so components reference *meaning*, not a specific shade — this is what makes a future palette swap a one-file change:

| Semantic token | Maps to |
|---|---|
| `color-bg-page` | `neutral-50` |
| `color-bg-surface` | `neutral-0` (cards, modals) |
| `color-border-default` | `neutral-200` |
| `color-text-primary` | `neutral-900` |
| `color-text-secondary` | `neutral-500` |
| `color-text-placeholder` | `neutral-400` |
| `color-text-on-brand` | `neutral-0` (text on `brand-600` buttons) |
| `color-action-primary` | `brand-600` |
| `color-action-primary-hover` | `brand-700` |
| `color-focus-ring` | `brand-500` |

---

## 2. Typography tokens

**Font family:** `Inter, system-ui, -apple-system, sans-serif` (single family throughout — no secondary display font).

| Token | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `text-display` | 36px / `2.25rem` | 44px | 700 | Hero headline ("Train Ticket Booking in 2 Minutes") |
| `text-h1` | 30px / `1.875rem` | 38px | 700 | Page titles |
| `text-h2` | 24px / `1.5rem` | 32px | 600 | Section headers |
| `text-h3` | 20px / `1.25rem` | 28px | 600 | Card titles, subsection headers |
| `text-body-lg` | 18px / `1.125rem` | 28px | 400 | Lead paragraph text |
| `text-body` | 16px / `1rem` | 24px | 400 | Default body text, form labels |
| `text-body-sm` | 14px / `0.875rem` | 20px | 400 | Secondary/meta text, helper text |
| `text-caption` | 12px / `0.75rem` | 16px | 500 | Badge labels, timestamps, fine print |
| `text-overline` | 11px / `0.6875rem` | 14px | 600, uppercase, `letter-spacing: 0.05em` | Section eyebrows (e.g. "TRAVEL INSIGHTS") |

**Weights used app-wide:** 400 (regular), 500 (medium — labels/badges), 600 (semibold — subheads), 700 (bold — headings). No other weights.

---

## 3. Spacing scale

4px base unit — matches Tailwind's default scale exactly, listed here for reference so no one invents an off-scale value:

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |

Component-level usage guide lives in `ui-rules.md` §2 — this table is the raw scale only.

---

## 4. Radius tokens

| Token | Value | Use |
|---|---|---|
| `radius-input` | 10px | Inputs, dropdowns |
| `radius-card` | 16px | Cards, modals |
| `radius-chip` | 9999px (full) | Chips, pills, badges, avatar |
| `radius-sm` | 6px | Small nested elements (e.g. code/tag inside a card) |

---

## 5. Shadow tokens

| Token | Value | Use |
|---|---|---|
| `shadow-card` | `0 2px 8px rgba(17,24,39,0.06)` | Default card elevation |
| `shadow-card-hover` | `0 6px 20px rgba(17,24,39,0.10)` | Hoverable card on hover |
| `shadow-modal` | `0 12px 40px rgba(17,24,39,0.18)` | Modal / bottom sheet |
| `shadow-dropdown` | `0 4px 16px rgba(17,24,39,0.10)` | Autocomplete/dropdown panels |

---

## 6. Border tokens

| Token | Value |
|---|---|
| `border-width-default` | 1px |
| `border-width-focus` | 2px (used for the focus ring, not the resting border) |
| `border-color-default` | `color-border-default` (`neutral-200`) |
| `border-color-error` | `status-waitlist` |

---

## 7. Breakpoints

*(canonical values — `ui-rules.md` §1 describes the behavior at each)*

| Token | Min-width |
|---|---|
| `screen-sm` | 640px |
| `screen-md` | 768px |
| `screen-lg` | 1024px |
| `screen-xl` | 1280px |

---

## 8. Z-index scale

*(canonical values — `ui-rules.md` §11 describes what lives at each layer)*

| Token | Value |
|---|---|
| `z-base` | 0 |
| `z-sticky` | 10 |
| `z-dropdown` | 20 |
| `z-banner` | 30 |
| `z-toast` | 40 |
| `z-modal` | 50 |

---

## 9. Motion tokens

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Micro-interactions (chip select, icon toggle) |
| `duration-base` | 200ms | Default hover/focus/active transitions |
| `duration-entry` | 300ms | Modal/sheet entering |
| `duration-exit` | 200ms | Modal/sheet exiting (faster than entry) |
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default easing for all transitions |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entry animations |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |

---

## 10. Icon size tokens

| Token | Value | Pairs with |
|---|---|---|
| `icon-sm` | 16px | `text-body-sm` |
| `icon-md` | 20px | `text-body` |
| `icon-lg` | 24px | Standalone icon buttons, `text-h3`+ |

---

## 11. Opacity tokens

| Token | Value | Use |
|---|---|---|
| `opacity-disabled` | 0.5 | Disabled buttons/inputs |
| `opacity-tint` | 0.1 | Status badge background tints (applied to the status hex, or use the pre-mixed `*-bg` tokens in §1.3) |
| `opacity-backdrop` | 0.4 | Modal/sheet backdrop overlay |

---

## 12. Ready-to-paste `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 400: '#818cf8',
          500: '#4f46e5', 600: '#4338ca', 700: '#3730a3', 900: '#1e3a8a',
        },
        accent: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        status: {
          confirmed: '#16a34a', confirmedBg: '#dcfce7',
          rac: '#d97706', racBg: '#fef3c7',
          waitlist: '#dc2626', waitlistBg: '#fee2e2',
        },
        neutral: {
          0: '#ffffff', 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb',
          400: '#9ca3af', 500: '#6b7280', 700: '#374151', 900: '#111827',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }],
        h1: ['1.875rem', { lineHeight: '2.375rem', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        body: ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        overline: ['0.6875rem', { lineHeight: '0.875rem', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      borderRadius: { input: '10px', card: '16px', chip: '9999px', sm: '6px' },
      boxShadow: {
        card: '0 2px 8px rgba(17,24,39,0.06)',
        cardHover: '0 6px 20px rgba(17,24,39,0.10)',
        modal: '0 12px 40px rgba(17,24,39,0.18)',
        dropdown: '0 4px 16px rgba(17,24,39,0.10)',
      },
      transitionDuration: { fast: '150ms', base: '200ms', entry: '300ms', exit: '200ms' },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
      },
      zIndex: { sticky: '10', dropdown: '20', banner: '30', toast: '40', modal: '50' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    },
  },
  plugins: [],
};

export default config;
```

---

## 13. CSS variable equivalents

For any context outside Tailwind utility classes (e.g. a raw `<style>` block, a chart library needing a JS-readable color), mirror the same values as CSS variables in `globals.css`:

```css
:root {
  --color-brand-600: #4338ca;
  --color-accent-500: #f59e0b;
  --color-status-confirmed: #16a34a;
  --color-status-rac: #d97706;
  --color-status-waitlist: #dc2626;
  --color-bg-page: #f9fafb;
  --color-bg-surface: #ffffff;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --radius-card: 16px;
  --shadow-card: 0 2px 8px rgba(17,24,39,0.06);
}
```

---

*Any component, page, or chart in the app draws its colors, type, spacing, radii, shadows, motion, and z-index exclusively from this file's tokens — no raw hex codes, arbitrary pixel values, or ad-hoc timing values anywhere else in the codebase.*