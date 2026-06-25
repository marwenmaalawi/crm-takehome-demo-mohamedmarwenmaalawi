import { getClients } from '@/lib/api';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { PageHeader } from '@/components/PageHeader';
import { OpportunityForm } from '@/components/OpportunityForm';

export const dynamic = 'force-dynamic';

export default async function NewOpportunityPage() {
  const locale = getLocale();
  const clients = await getClients();

  return (
    <>
      <PageHeader title={t(locale, 'form.newTitle')} />
      <OpportunityForm locale={locale} clients={clients} />
    </>
  );
}
