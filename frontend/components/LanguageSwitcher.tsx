'use client';

import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, t, type Locale } from '@/lib/i18n';

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const next: Locale = locale === 'fr' ? 'en' : 'fr';

  const switchTo = () => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  };

  return (
    <button onClick={switchTo} className="btn-secondary w-full text-xs" aria-label="Switch language">
      {t(locale, 'lang.switch')}
    </button>
  );
}
