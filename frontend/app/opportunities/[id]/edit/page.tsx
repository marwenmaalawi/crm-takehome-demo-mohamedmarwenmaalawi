import { notFound } from 'next/navigation';
import { getClients, getOpportunity } from '@/lib/api';
import { ApiRequestError } from '@/lib/api';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { PageHeader } from '@/components/PageHeader';
import { OpportunityForm } from '@/components/OpportunityForm';

export const dynamic = 'force-dynamic';

export default async function EditOpportunityPage({ params }: { params: { id: string } }) {
  const locale = getLocale();

  const [clients, opportunity] = await Promise.all([
    getClients(),
    getOpportunity(params.id).catch((err) => {
      if (err instanceof ApiRequestError && err.status === 404) notFound();
      throw err;
    }),
  ]);

  return (
    <>
      <PageHeader title={t(locale, 'form.editTitle')} subtitle={opportunity.title} />
      <OpportunityForm
        locale={locale}
        clients={clients}
        opportunityId={opportunity.id}
        defaults={{
          title: opportunity.title,
          clientId: opportunity.clientId,
          amount: opportunity.amount,
          expectedCloseDate: opportunity.expectedCloseDate,
          stage: opportunity.stage,
          status: opportunity.status,
          ownerName: opportunity.ownerName,
          notes: opportunity.notes ?? '',
          nextStep: opportunity.nextStep ?? '',
          nextStepDueAt: opportunity.nextStepDueAt ?? '',
        }}
      />
    </>
  );
}
