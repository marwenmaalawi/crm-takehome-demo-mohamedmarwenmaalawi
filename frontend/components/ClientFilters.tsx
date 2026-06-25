'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ClientType } from '@crm/contracts';
import { clientTypeLabels, t, type Locale } from '@/lib/i18n';

export function ClientFilters({ locale }: { locale: Locale }) {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/clients?${next.toString()}`);
    },
    [params, router],
  );

  const get = (k: string) => params.get(k) ?? '';

  return (
    <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
      <label className="flex flex-1 flex-col" style={{ minWidth: 200 }}>
        <span className="label">{t(locale, 'filter.search')}</span>
        <input
          className="input"
          defaultValue={get('search')}
          placeholder={t(locale, 'filter.searchPlaceholder')}
          onChange={(e) => setParam('search', e.target.value)}
        />
      </label>

      <label className="flex flex-col">
        <span className="label">{t(locale, 'filter.clientType')}</span>
        <select className="input" value={get('type')} onChange={(e) => setParam('type', e.target.value)}>
          <option value="">{t(locale, 'filter.all')}</option>
          {Object.values(ClientType).map((c) => (
            <option key={c} value={c}>{clientTypeLabels[locale][c]}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
