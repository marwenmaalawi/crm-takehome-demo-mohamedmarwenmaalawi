'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  ClientType,
  OpportunityStage,
  OpportunityStatus,
} from '@crm/contracts';
import {
  clientTypeLabels,
  stageLabels,
  statusLabels,
  t,
  type Locale,
} from '@/lib/i18n';

/** Filter bar. Every change is reflected in the URL so the server re-fetches (App Router idiom). */
export function OpportunityFilters({ locale }: { locale: Locale }) {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page'); // any filter change returns to page 1
      router.push(`/opportunities?${next.toString()}`);
    },
    [params, router],
  );

  const get = (k: string) => params.get(k) ?? '';

  return (
    <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
      <label className="flex flex-1 flex-col" style={{ minWidth: 180 }}>
        <span className="label">{t(locale, 'filter.search')}</span>
        <input
          className="input"
          defaultValue={get('search')}
          placeholder={t(locale, 'filter.searchPlaceholder')}
          onChange={(e) => setParam('search', e.target.value)}
        />
      </label>

      <label className="flex flex-col">
        <span className="label">{t(locale, 'filter.stage')}</span>
        <select className="input" value={get('stage')} onChange={(e) => setParam('stage', e.target.value)}>
          <option value="">{t(locale, 'filter.all')}</option>
          {Object.values(OpportunityStage).map((s) => (
            <option key={s} value={s}>{stageLabels[locale][s]}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col">
        <span className="label">{t(locale, 'filter.status')}</span>
        <select className="input" value={get('status')} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">{t(locale, 'filter.all')}</option>
          {Object.values(OpportunityStatus).map((s) => (
            <option key={s} value={s}>{statusLabels[locale][s]}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col">
        <span className="label">{t(locale, 'filter.clientType')}</span>
        <select
          className="input"
          value={get('clientType')}
          onChange={(e) => setParam('clientType', e.target.value)}
        >
          <option value="">{t(locale, 'filter.all')}</option>
          {Object.values(ClientType).map((c) => (
            <option key={c} value={c}>{clientTypeLabels[locale][c]}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 pb-2">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          checked={get('problemOnly') === 'true'}
          onChange={(e) => setParam('problemOnly', e.target.checked ? 'true' : '')}
        />
        <span className="text-sm text-slate-600">{t(locale, 'filter.problemOnly')}</span>
      </label>
    </div>
  );
}
