import type { Locale } from './i18n';

const localeTag: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

/** Format a decimal-string EUR amount. */
export function formatCurrency(amount: string, locale: Locale): string {
  return new Intl.NumberFormat(localeTag[locale], {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/** Format a `YYYY-MM-DD` date. */
export function formatDate(dateOnly: string, locale: Locale): string {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Intl.DateTimeFormat(localeTag[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Format an ISO timestamp as a date. */
export function formatTimestamp(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatPercent(ratio: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag[locale], {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(ratio);
}
