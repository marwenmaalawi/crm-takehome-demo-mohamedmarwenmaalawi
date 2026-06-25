import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiRequestError, getOpportunity } from '@/lib/api';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { formatCurrency, formatDate, formatTimestamp } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { ProblemBadges, StageBadge, StatusBadge } from '@/components/badges';
import { StageStepper } from '@/components/StageStepper';
import { ClientCard } from '@/components/ClientCard';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { LogActivityForm } from '@/components/LogActivityForm';
import { DeleteOpportunityButton } from '@/components/DeleteOpportunityButton';

export const dynamic = 'force-dynamic';

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const locale = getLocale();

  const opportunity = await getOpportunity(params.id).catch((err) => {
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    throw err;
  });

  return (
    <>
      <PageHeader
        title={opportunity.title}
        actions={
          <>
            <Link href="/opportunities" className="btn-secondary">{t(locale, 'action.back')}</Link>
            <Link href={`/opportunities/${opportunity.id}/edit`} className="btn-secondary">
              {t(locale, 'action.edit')}
            </Link>
            <DeleteOpportunityButton id={opportunity.id} locale={locale} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={opportunity.status} locale={locale} />
              <ProblemBadges problem={opportunity.problem} locale={locale} showHealthy />
              {/* Owner chip — visible at a glance without scrolling to the sidebar */}
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
                {opportunity.ownerName}
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {opportunity.daysInStage} {t(locale, 'opp.daysInStage')}
              </span>
            </div>

            <div className="mt-5">
              <StageStepper stage={opportunity.stage} locale={locale} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {t(locale, 'list.col.amount')}
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatCurrency(opportunity.amount, locale)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {t(locale, 'list.col.closeDate')}
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {formatDate(opportunity.expectedCloseDate, locale)}
                </div>
              </div>
            </div>

            {/* Next step */}
            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">{t(locale, 'opp.nextStep')}</div>
              {opportunity.nextStep ? (
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">{opportunity.nextStep}</span>
                  {opportunity.nextStepDueAt ? (
                    <span className="shrink-0 text-xs tabular-nums text-slate-500">
                      {t(locale, 'opp.nextStepDue')} : {formatDate(opportunity.nextStepDueAt, locale)}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="mt-1 text-sm text-slate-400">{t(locale, 'opp.noNextStep')}</div>
              )}
            </div>
          </div>

          {/* Activity timeline */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">{t(locale, 'activity.timeline')}</h2>
              <LogActivityForm opportunityId={opportunity.id} locale={locale} />
            </div>
            <ActivityTimeline activities={opportunity.activities} locale={locale} />
          </div>

          {opportunity.notes ? (
            <div className="card p-6">
              <h2 className="mb-2 text-sm font-semibold text-slate-800">{t(locale, 'detail.notes')}</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{opportunity.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <ClientCard client={opportunity.client} locale={locale} />

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">{t(locale, 'detail.timeline')}</h2>
            <div className="divide-y divide-slate-100 text-sm">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">{t(locale, 'detail.createdAt')}</span>
                <span className="text-slate-700">{formatTimestamp(opportunity.createdAt, locale)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">{t(locale, 'opp.lastActivity')}</span>
                <span className="text-slate-700">
                  {opportunity.lastActivityAt ? formatTimestamp(opportunity.lastActivityAt, locale) : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">{t(locale, 'list.col.owner')}</span>
                <span className="text-slate-700">{opportunity.ownerName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
