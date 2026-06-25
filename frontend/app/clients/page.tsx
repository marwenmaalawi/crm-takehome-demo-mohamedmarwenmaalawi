import Link from 'next/link';
import { listClientsQuerySchema } from '@crm/contracts';
import { getClients } from '@/lib/api';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { PageHeader } from '@/components/PageHeader';
import { ClientFilters } from '@/components/ClientFilters';
import { ClientsTable } from '@/components/ClientsTable';

export const dynamic = 'force-dynamic';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const locale = getLocale();
  const query = listClientsQuerySchema.parse(searchParams);
  const clients = await getClients(query);

  return (
    <>
      <PageHeader
        title={t(locale, 'clients.title')}
        actions={
          <Link href="/clients/new" className="btn-primary">
            + {t(locale, 'action.newClient')}
          </Link>
        }
      />
      <ClientFilters locale={locale} />
      <ClientsTable clients={clients} locale={locale} />
    </>
  );
}
