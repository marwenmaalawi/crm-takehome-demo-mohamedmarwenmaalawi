import Link from 'next/link';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';

export default function ClientNotFound() {
  const locale = getLocale();
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="text-3xl font-semibold text-slate-300">404</div>
      <p className="text-sm text-slate-500">
        {locale === 'fr' ? 'Client introuvable.' : 'Client not found.'}
      </p>
      <Link href="/clients" className="btn-secondary mt-2">
        {t(locale, 'nav.clients')}
      </Link>
    </div>
  );
}
