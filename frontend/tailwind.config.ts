import type { Config } from 'tailwindcss';

/**
 * Design tokens for the CRM (DESIGN_SYSTEM, folded in here).
 * Calm neutral canvas, a single brand accent, and semantic colors for status / problems.
 *
 * @author Mohamed Marwen Maalawi
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // Extra step so 1080p / 2K / 4K get denser layouts (primary targets: 1366 & 1080p).
        '3xl': '1920px',
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        // Semantic
        success: { soft: '#dcfce7', base: '#16a34a', text: '#166534' },
        danger: { soft: '#fee2e2', base: '#dc2626', text: '#991b1b' },
        warning: { soft: '#fef3c7', base: '#d97706', text: '#92400e' },
        info: { soft: '#e0f2fe', base: '#0284c7', text: '#075985' },
        neutral: { soft: '#f1f5f9', base: '#64748b', text: '#334155' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
