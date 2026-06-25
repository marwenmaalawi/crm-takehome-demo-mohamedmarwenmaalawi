'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { PaginationMeta } from '@crm/contracts';
import { t, type Locale } from '@/lib/i18n';

export function Pagination({ meta, locale }: { meta: PaginationMeta; locale: Locale }) {
  const router = useRouter();
  const params = useSearchParams();

  const goto = (page: number) => {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(page));
    router.push(`/opportunities?${next.toString()}`);
  };

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>
        {meta.total} {t(locale, 'pagination.total')}
      </span>
      <div className="flex items-center gap-2">
        <button className="btn-secondary" disabled={!meta.hasPrev} onClick={() => goto(meta.page - 1)}>
          {t(locale, 'pagination.prev')}
        </button>
        <span className="px-2 tabular-nums">
          {t(locale, 'pagination.page')} {meta.page} {t(locale, 'pagination.of')} {meta.totalPages}
        </span>
        <button className="btn-secondary" disabled={!meta.hasNext} onClick={() => goto(meta.page + 1)}>
          {t(locale, 'pagination.next')}
        </button>
      </div>
    </div>
  );
}
