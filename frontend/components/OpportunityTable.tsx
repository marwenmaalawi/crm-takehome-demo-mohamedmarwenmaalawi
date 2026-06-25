import Link from 'next/link';
import { ProblemFlag, type OpportunityDto } from '@crm/contracts';
import { t, type Locale } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/format';
import { ProblemBadges, StageBadge, StatusBadge } from './badges';

/**
 * Left-border accent: red when overdue, amber when only stalled, transparent otherwise.
 * This gives an at-a-glance read of the row's business risk without relying solely on badges.
 */
function rowAccentClass(o: OpportunityDto): string {
  if (!o.problem.isProblem) return 'border-l-transparent';
  if (o.problem.flags.includes(ProblemFlag.OVERDUE)) return 'border-l-danger-base bg-danger-soft/20';
  return 'border-l-warning-base bg-warning-soft/20';
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
      <div className="card px-6 py-16 text-center">
        <p className="text-sm text-slate-500">{t(locale, 'list.empty')}</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop table (sm+) ── */}
      <div className="card hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">{t(locale, 'list.col.title')}</th>
              <th className="px-4 py-3">{t(locale, 'list.col.client')}</th>
              <th className="px-4 py-3">{t(locale, 'list.col.stage')}</th>
              <th className="px-4 py-3">{t(locale, 'list.col.status')}</th>
              <th className="px-4 py-3 text-right">{t(locale, 'list.col.amount')}</th>
              <th className="px-4 py-3">{t(locale, 'list.col.closeDate')}</th>
              {/* Extra columns reveal on wide screens (xl / 1080p+) */}
              <th className="hidden px-4 py-3 xl:table-cell">{t(locale, 'list.col.nextStep')}</th>
              <th className="hidden px-4 py-3 xl:table-cell">{t(locale, 'list.col.aging')}</th>
              <th className="px-4 py-3">{t(locale, 'list.col.state')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((o) => (
              <tr
                key={o.id}
                className={`group row-clickable border-l-4 ${rowAccentClass(o)}`}
              >
                <td className="px-4 py-3">
                  {/*
                   * Stretched link: after::absolute covers the entire row area.
                   * Other interactive elements (nested links, buttons) must be
                   * positioned relatively with z-index > 0 to remain on top.
                   */}
                  <Link
                    href={`/opportunities/${o.id}`}
                    className="font-medium text-slate-800 after:absolute after:inset-0 group-hover:text-brand-700"
                    title={o.title}
                  >
                    {o.title}
                  </Link>
                  <div className="mt-0.5 text-xs text-slate-400">{o.ownerName}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{o.clientName ?? '—'}</td>
                <td className="px-4 py-3">
                  <StageBadge stage={o.stage} locale={locale} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} locale={locale} />
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-700">
                  {formatCurrency(o.amount, locale)}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-600">
                  {formatDate(o.expectedCloseDate, locale)}
                </td>
                <td className="hidden max-w-[180px] truncate px-4 py-3 text-slate-500 xl:table-cell">
                  {o.nextStep ? (
                    <span title={o.nextStep}>
                      {o.nextStep}
                      {o.nextStepDueAt ? (
                        <span className="block text-xs text-slate-400">
                          {formatDate(o.nextStepDueAt, locale)}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 tabular-nums text-slate-500 xl:table-cell">
                  {o.daysInStage} {t(locale, 'opp.daysInStage')}
                </td>
                <td className="px-4 py-3">
                  <ProblemBadges problem={o.problem} locale={locale} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card-list (< sm) ── */}
      <div className="flex flex-col gap-3 sm:hidden">
        {items.map((o) => (
          <Link
            key={o.id}
            href={`/opportunities/${o.id}`}
            className={`card block border-l-4 p-4 transition hover:shadow-md ${rowAccentClass(o)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-slate-800">{o.title}</span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-700">
                {formatCurrency(o.amount, locale)}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">{o.clientName ?? '—'}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StageBadge stage={o.stage} locale={locale} />
              <StatusBadge status={o.status} locale={locale} />
              <ProblemBadges problem={o.problem} locale={locale} />
            </div>
            <div className="mt-2 text-xs tabular-nums text-slate-400">
              {formatDate(o.expectedCloseDate, locale)}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
