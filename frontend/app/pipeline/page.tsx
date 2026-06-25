import Link from 'next/link';
import { getPipelineBoard } from '@/lib/api';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/server-locale';
import { PageHeader } from '@/components/PageHeader';
import { PipelineBoardView } from '@/components/PipelineBoardView';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const locale = getLocale();
  const board = await getPipelineBoard();

  return (
    <>
      <PageHeader
        title={t(locale, 'pipeline.title')}
        subtitle={t(locale, 'pipeline.subtitle')}
        actions={
          <Link href="/opportunities/new" className="btn-primary">
            + {t(locale, 'action.new')}
          </Link>
        }
      />
      <PipelineBoardView board={board} locale={locale} />
    </>
  );
}
