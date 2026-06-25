'use client';

import { useEffect } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, t, type Locale } from '@/lib/i18n';
import { ErrorState } from './ErrorState';

function readLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

/** Shared client error UI for App Router `error.tsx` boundaries. */
export function ErrorBoundaryView({ error, reset }: { error: Error; reset: () => void }) {
  const locale = readLocale();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title={t(locale, 'state.errorTitle')}
      message={error.message}
      retryLabel={t(locale, 'action.retry')}
      onRetry={reset}
    />
  );
}
