'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProblemFlag, type OpportunityDto, type PipelineBoard } from '@crm/contracts';
import { stageLabels, t, type Locale } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/format';
import { ProblemBadges } from './badges';

function cardAccentClass(o: OpportunityDto): string {
  if (!o.problem.isProblem) return 'border-l-transparent';
  if (o.problem.flags.includes(ProblemFlag.OVERDUE)) return 'border-l-danger-base';
  return 'border-l-warning-base';
}

function PipelineCard({ o, locale }: { o: OpportunityDto; locale: Locale }) {
  return (
    <Link
      href={`/opportunities/${o.id}`}
      className={[
        'block rounded-lg border border-slate-200 border-l-4 bg-white p-3 transition',
        'hover:border-brand-300 hover:shadow-md',
        cardAccentClass(o),
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-slate-800">{o.title}</span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
          {formatCurrency(o.amount, locale)}
        </span>
      </div>

      {/* Client name */}
      <div className="mt-0.5 truncate text-xs text-slate-400">{o.clientName ?? '—'}</div>

      {/* Owner chip + close date */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
          {o.ownerName}
        </span>
        <span className="text-xs tabular-nums text-slate-400">
          {formatDate(o.expectedCloseDate, locale)}
        </span>
      </div>

      {/* Problem badges — only rendered when there is an issue */}
      {o.problem.isProblem ? (
        <div className="mt-2">
          <ProblemBadges problem={o.problem} locale={locale} />
        </div>
      ) : null}
    </Link>
  );
}

type ColState = Record<string, boolean>;

/**
 * Read-only pipeline board: one column per open stage, totals in the header, cards beneath.
 * On mobile the columns are collapsible to keep the view manageable.
 */
export function PipelineBoardView({ board, locale }: { board: PipelineBoard; locale: Locale }) {
  // All columns start open
  const [collapsed, setCollapsed] = useState<ColState>({});
  const toggle = (stage: string) => setCollapsed((s) => ({ ...s, [stage]: !s[stage] }));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {board.map((col) => {
        const isCollapsed = collapsed[col.stage] ?? false;
        return (
          <section key={col.stage} className="flex flex-col rounded-xl bg-slate-100/70 p-3">
            {/* Column header */}
            <header className="mb-2 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-700">
                  {stageLabels[locale][col.stage]}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                  {col.count}
                </span>
              </div>

              {/* Collapse toggle — useful on mobile to hide long columns */}
              <button
                type="button"
                onClick={() => toggle(col.stage)}
                aria-expanded={!isCollapsed}
                className="rounded p-0.5 text-xs text-slate-400 hover:bg-white hover:text-slate-600"
                title={isCollapsed ? 'Développer' : 'Réduire'}
              >
                {isCollapsed ? '▶' : '▼'}
              </button>
            </header>

            {/* Stage total value */}
            <div className="mb-3 px-1 text-base font-bold tabular-nums text-slate-700">
              {formatCurrency(col.value, locale)}
            </div>

            {/* Cards */}
            {!isCollapsed ? (
              <div className="flex flex-col gap-2">
                {col.opportunities.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 px-2 py-6 text-center text-xs text-slate-400">
                    {t(locale, 'pipeline.empty')}
                  </p>
                ) : (
                  col.opportunities.map((o) => (
                    <PipelineCard key={o.id} o={o} locale={locale} />
                  ))
                )}
              </div>
            ) : (
              <p className="py-1 text-center text-xs text-slate-400">
                {col.count} {col.count === 1 ? 'opportunité' : 'opportunités'} masquées
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
