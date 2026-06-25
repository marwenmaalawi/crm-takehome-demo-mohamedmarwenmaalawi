import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { PageHeader } from '@/components/PageHeader';
import { ClientForm } from '@/components/ClientForm';

export const dynamic = 'force-dynamic';

export default function NewClientPage() {
  const locale = getLocale();
  return (
    <>
      <PageHeader title={t(locale, 'clientForm.newTitle')} />
      <ClientForm locale={locale} />
    </>
  );
}
