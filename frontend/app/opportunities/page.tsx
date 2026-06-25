import Link from 'next/link';
import { listOpportunitiesQuerySchema } from '@crm/contracts';
import { listOpportunities } from '@/lib/api';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { PageHeader } from '@/components/PageHeader';
import { OpportunityFilters } from '@/components/OpportunityFilters';
import { OpportunityTable } from '@/components/OpportunityTable';
import { Pagination } from '@/components/Pagination';

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const locale = getLocale();

  // Validate/normalize incoming query params with the shared schema (defaults included).
  const query = listOpportunitiesQuerySchema.parse(searchParams);
  const { data, meta } = await listOpportunities(query);

  return (
    <>
      <PageHeader
        title={t(locale, 'list.title')}
        actions={
          <Link href="/opportunities/new" className="btn-primary">
            + {t(locale, 'action.new')}
          </Link>
        }
      />
      <OpportunityFilters locale={locale} />
      <OpportunityTable items={data} locale={locale} />
      <Pagination meta={meta} locale={locale} />
    </>
  );
}
