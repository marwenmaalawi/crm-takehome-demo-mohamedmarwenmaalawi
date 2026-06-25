import { ClientType, type ClientDto } from '@crm/contracts';
import { clientTypeLabels, t, type Locale } from '@/lib/i18n';
import { ClientTypeBadge } from './badges';

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}

const companyRows = (locale: Locale) =>
  locale === 'fr'
    ? { siren: 'SIREN', industry: 'Secteur', headcount: 'Effectif' }
    : { siren: 'Reg. no.', industry: 'Industry', headcount: 'Headcount' };

export function ClientCard({ client, locale }: { client: ClientDto; locale: Locale }) {
  const labels = locale === 'fr'
    ? { email: 'E-mail', phone: 'Téléphone', owner: 'Responsable' }
    : { email: 'Email', phone: 'Phone', owner: 'Owner' };
  const c = companyRows(locale);

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">{t(locale, 'detail.client')}</h2>
        <ClientTypeBadge type={client.type} locale={locale} />
      </div>
      <div className="text-base font-semibold text-slate-900">{client.displayName}</div>
      <div className="mt-3 divide-y divide-slate-100">
        {client.type === ClientType.COMPANY ? (
          <>
            <Row label={c.siren} value={client.siren} />
            <Row label={c.industry} value={client.industry} />
            <Row label={c.headcount} value={client.headcount} />
            <Row
              label={t(locale, 'clientDetail.contact')}
              value={
                client.contactName
                  ? [client.contactName, client.contactRole].filter(Boolean).join(' · ')
                  : null
              }
            />
            <Row label={labels.email} value={client.contactEmail} />
          </>
        ) : null}
        <Row label={labels.email} value={client.email} />
        <Row label={labels.phone} value={client.phone} />
        <Row label={labels.owner} value={client.ownerName} />
      </div>
    </div>
  );
}
