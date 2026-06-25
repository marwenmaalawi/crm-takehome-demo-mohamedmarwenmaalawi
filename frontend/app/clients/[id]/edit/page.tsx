import { notFound } from 'next/navigation';
import { ApiRequestError, getClient } from '@/lib/api';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { PageHeader } from '@/components/PageHeader';
import { ClientForm } from '@/components/ClientForm';

export const dynamic = 'force-dynamic';

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const locale = getLocale();

  const client = await getClient(params.id).catch((err) => {
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    throw err;
  });

  return (
    <>
      <PageHeader title={t(locale, 'clientForm.editTitle')} subtitle={client.displayName} />
      <ClientForm
        locale={locale}
        clientId={client.id}
        defaults={{
          type: client.type,
          legalName: client.legalName ?? '',
          siren: client.siren ?? '',
          industry: client.industry ?? '',
          headcount: client.headcount ?? '',
          firstName: client.firstName ?? '',
          lastName: client.lastName ?? '',
          email: client.email ?? '',
          phone: client.phone ?? '',
          ownerName: client.ownerName,
        }}
      />
    </>
  );
}
