import Link from 'next/link';
import { ProblemFlag, type OpportunityDto } from '@crm/contracts';
import { t, type Locale } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/format';
import { ProblemBadges, StageBadge, StatusBadge } from './badges';

/** Left-accent tone: red when overdue, amber when only stalled, transparent otherwise. */
function rowAccent(o: OpportunityDto): string {
  if (!o.problem.isProblem) return 'border-l-transparent';
  if (o.problem.flags.includes(ProblemFlag.OVERDUE)) return 'border-l-danger-base bg-danger-soft/30';
  return 'border-l-warning-base bg-warning-soft/30';
}

export function OpportunityTable({
  items,
  locale,
}: {
  items: OpportunityDto[];
  locale: Locale;
}) {
  if (items.length === 0) {
    return (
      <div className="card px-6 py-16 text-center text-sm text-slate-500">{t(locale, 'list.empty')}</div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2.5 font-medium">{t(locale, 'list.col.title')}</th>
            <th className="px-4 py-2.5 font-medium">{t(locale, 'list.col.client')}</th>
            <th className="px-4 py-2.5 font-medium">{t(locale, 'list.col.stage')}</th>
            <th className="px-4 py-2.5 font-medium">{t(locale, 'list.col.status')}</th>
            <th className="px-4 py-2.5 text-right font-medium">{t(locale, 'list.col.amount')}</th>
            <th className="px-4 py-2.5 font-medium">{t(locale, 'list.col.closeDate')}</th>
            {/* Extra columns reveal on wide screens (1080p+) for higher density */}
            <th className="hidden px-4 py-2.5 font-medium xl:table-cell">{t(locale, 'list.col.nextStep')}</th>
            <th className="hidden px-4 py-2.5 font-medium xl:table-cell">{t(locale, 'list.col.aging')}</th>
            <th className="px-4 py-2.5 font-medium">{t(locale, 'list.col.state')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((o) => (
            <tr
              key={o.id}
              className={`group relative cursor-pointer border-l-4 transition hover:bg-slate-50 ${rowAccent(o)}`}
            >
              <td className="px-4 py-2.5">
                {/* Stretched link: the whole row is clickable, but nested links stay on top (z-10). */}
                <Link
                  href={`/opportunities/${o.id}`}
                  className="font-medium text-slate-800 after:absolute after:inset-0 group-hover:text-brand-700"
                >
                  {o.title}
                </Link>
                <div className="text-xs text-slate-400">{o.ownerName}</div>
              </td>
              <td className="px-4 py-2.5 text-slate-600">
                {o.clientName ?? '—'}
              </td>
              <td className="px-4 py-2.5"><StageBadge stage={o.stage} locale={locale} /></td>
              <td className="px-4 py-2.5"><StatusBadge status={o.status} locale={locale} /></td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-700">
                {formatCurrency(o.amount, locale)}
              </td>
              <td className="px-4 py-2.5 tabular-nums text-slate-600">
                {formatDate(o.expectedCloseDate, locale)}
              </td>
              <td className="hidden max-w-[200px] truncate px-4 py-2.5 text-slate-600 xl:table-cell">
                {o.nextStep ? (
                  <span title={o.nextStep}>
                    {o.nextStep}
                    {o.nextStepDueAt ? (
                      <span className="text-slate-400"> · {formatDate(o.nextStepDueAt, locale)}</span>
                    ) : null}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="hidden px-4 py-2.5 tabular-nums text-slate-500 xl:table-cell">
                {o.daysInStage} {t(locale, 'opp.daysInStage')}
              </td>
              <td className="px-4 py-2.5"><ProblemBadges problem={o.problem} locale={locale} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
