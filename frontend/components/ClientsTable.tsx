import Link from 'next/link';
import type { ClientDto } from '@crm/contracts';
import { t, type Locale } from '@/lib/i18n';
import { ClientTypeBadge } from './badges';

export function ClientsTable({ clients, locale }: { clients: ClientDto[]; locale: Locale }) {
  if (clients.length === 0) {
    return (
      <div className="card px-6 py-16 text-center text-sm text-slate-500">{t(locale, 'clients.empty')}</div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-medium">{t(locale, 'clients.col.name')}</th>
            <th className="px-4 py-3 font-medium">{t(locale, 'clients.col.type')}</th>
            <th className="px-4 py-3 font-medium">{t(locale, 'clients.col.contact')}</th>
            <th className="px-4 py-3 font-medium">{t(locale, 'clients.col.owner')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clients.map((c) => (
            <tr key={c.id} className="group relative cursor-pointer transition hover:bg-slate-50">
              <td className="px-4 py-2.5">
                <Link
                  href={`/clients/${c.id}`}
                  className="font-medium text-slate-800 after:absolute after:inset-0 group-hover:text-brand-700"
                >
                  {c.displayName}
                </Link>
                {c.industry ? <div className="text-xs text-slate-400">{c.industry}</div> : null}
              </td>
              <td className="px-4 py-2.5"><ClientTypeBadge type={c.type} locale={locale} /></td>
              <td className="px-4 py-2.5 text-slate-600">{c.email ?? c.phone ?? '—'}</td>
              <td className="px-4 py-2.5 text-slate-600">{c.ownerName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
