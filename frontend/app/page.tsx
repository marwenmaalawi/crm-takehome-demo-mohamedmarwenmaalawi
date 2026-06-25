import Link from 'next/link';
import { getPipelineAttention, getPipelineSummary } from '@/lib/api';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { formatCurrency, formatPercent } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { StageBreakdown } from '@/components/StageBreakdown';
import { AttentionPanel } from '@/components/AttentionPanel';

// Always render fresh — KPIs are live figures.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const locale = getLocale();
  const [summary, attention] = await Promise.all([getPipelineSummary(), getPipelineAttention()]);

  const conversion =
    summary.conversionRate === null
      ? t(locale, 'kpi.noClosed')
      : formatPercent(summary.conversionRate, locale);

  return (
    <>
      <PageHeader
        title={t(locale, 'dashboard.title')}
        subtitle={t(locale, 'dashboard.subtitle')}
        actions={
          <Link href="/opportunities/new" className="btn-primary">
            + {t(locale, 'action.new')}
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t(locale, 'kpi.openValue')}
          value={formatCurrency(summary.openTotalValue, locale)}
          hint={`${summary.openCount} ${t(locale, 'kpi.openCount')}`}
          tone="brand"
        />
        <KpiCard
          label={t(locale, 'kpi.overdue')}
          value={formatCurrency(summary.overdue.value, locale)}
          hint={`${summary.overdue.count} ${t(locale, 'kpi.openCount')}`}
          tone="danger"
        />
        <KpiCard
          label={t(locale, 'kpi.stalled')}
          value={formatCurrency(summary.stalled.value, locale)}
          hint={`${summary.stalled.count} ${t(locale, 'kpi.openCount')}`}
          tone="warning"
        />
        <KpiCard
          label={t(locale, 'kpi.conversion')}
          value={conversion}
          hint={`${summary.wonCount} ${t(locale, 'kpi.won')} · ${summary.lostCount} ${t(locale, 'kpi.lost')}`}
          tone="success"
        />
      </div>

      <div className="mt-8">
        <AttentionPanel attention={attention} locale={locale} />
      </div>

      <div className="mt-8 card p-6">
        <h2 className="mb-5 text-base font-semibold text-slate-800">{t(locale, 'kpi.byStage')}</h2>
        <StageBreakdown items={summary.byStage} locale={locale} />
      </div>
    </>
  );
}
