import Link from 'next/link';
import { ProblemFlag, type OpportunityDto, type PipelineBoard } from '@crm/contracts';
import { stageLabels, t, type Locale } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/format';
import { ProblemBadges } from './badges';

function cardAccent(o: OpportunityDto): string {
  if (!o.problem.isProblem) return 'border-l-transparent';
  if (o.problem.flags.includes(ProblemFlag.OVERDUE)) return 'border-l-danger-base';
  return 'border-l-warning-base';
}

function PipelineCard({ o, locale }: { o: OpportunityDto; locale: Locale }) {
  return (
    <Link
      href={`/opportunities/${o.id}`}
      className={`block rounded-lg border border-slate-200 border-l-4 bg-white p-3 shadow-sm transition hover:border-brand-300 hover:shadow ${cardAccent(o)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{o.title}</span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
          {formatCurrency(o.amount, locale)}
        </span>
      </div>
      <div className="mt-0.5 truncate text-xs text-slate-400">{o.clientName ?? '—'}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-slate-500">{formatDate(o.expectedCloseDate, locale)}</span>
        <ProblemBadges problem={o.problem} locale={locale} />
      </div>
    </Link>
  );
}

/** Read-only pipeline: one column per stage, totals in the header, cards beneath. */
export function PipelineBoardView({ board, locale }: { board: PipelineBoard; locale: Locale }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {board.map((col) => (
        <section key={col.stage} className="flex flex-col rounded-xl bg-slate-100/70 p-3">
          <header className="mb-3 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-700">{stageLabels[locale][col.stage]}</h2>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
              {col.count}
            </span>
          </header>
          <div className="mb-3 px-1 text-sm font-semibold tabular-nums text-slate-600">
            {formatCurrency(col.value, locale)}
          </div>
          <div className="flex flex-col gap-2">
            {col.opportunities.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-2 py-6 text-center text-xs text-slate-400">
                {t(locale, 'pipeline.empty')}
              </p>
            ) : (
              col.opportunities.map((o) => <PipelineCard key={o.id} o={o} locale={locale} />)
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
