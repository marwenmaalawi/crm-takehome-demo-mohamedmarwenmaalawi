import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClientType } from '@crm/contracts';
import { ApiRequestError, getClient, listOpportunities } from '@/lib/api';
import { clientTypeLabels, t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { PageHeader } from '@/components/PageHeader';
import { ClientTypeBadge } from '@/components/badges';
import { OpportunityTable } from '@/components/OpportunityTable';
import { DeleteClientButton } from '@/components/DeleteClientButton';
import { HealthBadge, deriveHealth } from '@/components/HealthBadge';

export const dynamic = 'force-dynamic';

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const locale = getLocale();

  const client = await getClient(params.id).catch((err) => {
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    throw err;
  });

  // The client's opportunities, reusing the paginated list endpoint with a clientId filter.
  const { data: opportunities } = await listOpportunities({ clientId: client.id, pageSize: 100 });

  const health = deriveHealth(opportunities);
  const labels =
    locale === 'fr'
      ? { siren: 'SIREN', industry: 'Secteur', headcount: 'Effectif', email: 'E-mail', phone: 'Téléphone', owner: 'Responsable', contact: 'Contact', role: 'Fonction' }
      : { siren: 'Reg. no.', industry: 'Industry', headcount: 'Headcount', email: 'Email', phone: 'Phone', owner: 'Owner', contact: 'Contact', role: 'Role' };

  return (
    <>
      <PageHeader
        title={client.displayName}
        subtitle={clientTypeLabels[locale][client.type]}
        actions={
          <>
            <Link href="/clients" className="btn-secondary">{t(locale, 'action.back')}</Link>
            <Link href={`/clients/${client.id}/edit`} className="btn-secondary">
              {t(locale, 'action.edit')}
            </Link>
            <DeleteClientButton id={client.id} locale={locale} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">{t(locale, 'clientDetail.info')}</h2>
              <div className="flex items-center gap-2">
                <HealthBadge health={health} locale={locale} />
                <ClientTypeBadge type={client.type} locale={locale} />
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {client.type === ClientType.COMPANY ? (
                <>
                  <Row label={labels.siren} value={client.siren} />
                  <Row label={labels.industry} value={client.industry} />
                  <Row label={labels.headcount} value={client.headcount} />
                  <Row label={labels.contact} value={client.contactName} />
                  <Row label={labels.role} value={client.contactRole} />
                  <Row label={`${labels.contact} ${labels.email}`} value={client.contactEmail} />
                </>
              ) : null}
              <Row label={labels.email} value={client.email} />
              <Row label={labels.phone} value={client.phone} />
              <Row label={labels.owner} value={client.ownerName} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            {t(locale, 'clientDetail.opportunities')}
          </h2>
          {opportunities.length === 0 ? (
            <div className="card px-6 py-12 text-center text-sm text-slate-500">
              {t(locale, 'clientDetail.noOpportunities')}
            </div>
          ) : (
            <OpportunityTable items={opportunities} locale={locale} />
          )}
        </div>
      </div>
    </>
  );
}
