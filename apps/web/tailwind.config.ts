import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
          900: '#1e3a8a',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        status: {
          confirmed: '#16a34a',
          confirmedBg: '#dcfce7',
          rac: '#d97706',
          racBg: '#fef3c7',
          waitlist: '#dc2626',
          waitlistBg: '#fee2e2',
        },
        neutral: {
          0: '#ffffff',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          400: '#9ca3af',
          500: '#6b7280',
          700: '#374151',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
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
      borderRadius: {
        input: '10px',
        card: '16px',
        chip: '9999px',
        sm: '6px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(17,24,39,0.06)',
        cardHover: '0 6px 20px rgba(17,24,39,0.10)',
        modal: '0 12px 40px rgba(17,24,39,0.18)',
        dropdown: '0 4px 16px rgba(17,24,39,0.10)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        entry: '300ms',
        exit: '200ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
      },
      zIndex: {
        sticky: '10',
        dropdown: '20',
        banner: '30',
        toast: '40',
        modal: '50',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
