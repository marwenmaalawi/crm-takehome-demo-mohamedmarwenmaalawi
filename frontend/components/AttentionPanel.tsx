import Link from 'next/link';
import type { OpportunityDto, PipelineAttention } from '@crm/contracts';
import { t, type Locale } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/format';

type Tone = 'danger' | 'warning' | 'info';

const headStyles: Record<Tone, string> = {
  danger:  'text-danger-text',
  warning: 'text-warning-text',
  info:    'text-info-text',
};
const dotStyles: Record<Tone, string> = {
  danger:  'bg-danger-base',
  warning: 'bg-warning-base',
  info:    'bg-info-base',
};
const emptyBgStyles: Record<Tone, string> = {
  danger:  '',
  warning: '',
  info:    '',
};

function Column({
  title,
  tone,
  items,
  meta,
  locale,
}: {
  title: string;
  tone: Tone;
  items: OpportunityDto[];
  meta: (o: OpportunityDto) => string;
  locale: Locale;
}) {
  return (
    <div className="card flex flex-col p-5">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotStyles[tone]}`} aria-hidden />
        <h3 className={`text-sm font-semibold ${headStyles[tone]}`}>{title}</h3>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {items.length}
        </span>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-4 text-center text-xs text-success-text">
          <span aria-hidden className="mr-1">✓</span>
          {t(locale, 'attention.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((o) => (
            <li key={o.id}>
              <Link
                href={`/opportunities/${o.id}`}
                className="group block py-2.5 transition hover:opacity-80"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-slate-700 group-hover:text-brand-700">
                    {o.title}
                  </span>
                  <span className="shrink-0 tabular-nums text-sm text-slate-500">
                    {formatCurrency(o.amount, locale)}
                  </span>
                </div>
                {/* Client name + delay/stall reason on second line */}
                <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  {o.clientName ? (
                    <span className="truncate">{o.clientName}</span>
                  ) : null}
                  {o.clientName && meta(o) ? (
                    <span aria-hidden>·</span>
                  ) : null}
                  {meta(o) ? (
                    <span className={headStyles[tone]}>{meta(o)}</span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AttentionPanel({
  attention,
  locale,
}: {
  attention: PipelineAttention;
  locale: Locale;
}) {
  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-slate-800">{t(locale, 'attention.title')}</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <Column
          title={t(locale, 'attention.overdue')}
          tone="danger"
          items={attention.overdue}
          meta={(o) => o.problem.reasons[0] ?? ''}
          locale={locale}
        />
        <Column
          title={t(locale, 'attention.stalled')}
          tone="warning"
          items={attention.stalled}
          meta={(o) =>
            o.problem.reasons.find((r) => r.includes('Stagn') || r.includes('Stall')) ??
            o.problem.reasons[0] ??
            ''
          }
          locale={locale}
        />
        <Column
          title={t(locale, 'attention.upcoming')}
          tone="info"
          items={attention.upcomingSignatures}
          meta={(o) => formatDate(o.expectedCloseDate, locale)}
          locale={locale}
        />
      </div>
    </div>
  );
}
