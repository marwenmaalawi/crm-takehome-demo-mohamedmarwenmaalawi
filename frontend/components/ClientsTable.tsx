import Link from 'next/link';
import type { ClientDto } from '@crm/contracts';
import { t, type Locale } from '@/lib/i18n';
import { ClientTypeBadge } from './badges';

export function ClientsTable({ clients, locale }: { clients: ClientDto[]; locale: Locale }) {
  if (clients.length === 0) {
    return (
      <div className="card px-6 py-16 text-center">
        <p className="text-sm text-slate-500">{t(locale, 'clients.empty')}</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop table (sm+) ── */}
      <div className="card hidden overflow-hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">{t(locale, 'clients.col.name')}</th>
              <th className="px-4 py-3">{t(locale, 'clients.col.type')}</th>
              <th className="px-4 py-3">{t(locale, 'clients.col.contact')}</th>
              <th className="hidden px-4 py-3 xl:table-cell">{t(locale, 'clients.col.owner')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((c) => (
              <tr key={c.id} className="group row-clickable">
                <td className="px-4 py-3">
                  <Link
                    href={`/clients/${c.id}`}
                    className="font-medium text-slate-800 after:absolute after:inset-0 group-hover:text-brand-700"
                    title={c.displayName}
                  >
                    {c.displayName}
                  </Link>
                  {c.industry ? (
                    <div className="mt-0.5 text-xs text-slate-400">{c.industry}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <ClientTypeBadge type={c.type} locale={locale} />
                </td>
                <td className="px-4 py-3 text-slate-600">{c.email ?? c.phone ?? '—'}</td>
                <td className="hidden px-4 py-3 text-slate-600 xl:table-cell">{c.ownerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card-list (< sm) ── */}
      <div className="flex flex-col gap-3 sm:hidden">
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="card block p-4 transition hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-800">{c.displayName}</span>
              <ClientTypeBadge type={c.type} locale={locale} />
            </div>
            {c.industry ? (
              <div className="mt-0.5 text-xs text-slate-400">{c.industry}</div>
            ) : null}
            {(c.email ?? c.phone) ? (
              <div className="mt-2 text-xs text-slate-500">{c.email ?? c.phone}</div>
            ) : null}
            <div className="mt-1 text-xs text-slate-400">{c.ownerName}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
