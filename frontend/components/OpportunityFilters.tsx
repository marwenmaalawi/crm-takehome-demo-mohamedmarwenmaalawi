'use client';

import { useState } from 'react';
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

/**
 * Filter bar.
 * - Mobile (< sm): collapsed behind a "Filtres" toggle button.
 * - Desktop (sm+): always visible, single inline row.
 *
 * Every change is pushed to the URL so the server re-renders (App Router pattern).
 * The `page` param is cleared on any filter change to avoid stale pagination.
 */
export function OpportunityFilters({ locale }: { locale: Locale }) {
  const router = useRouter();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page');
      router.push(`/opportunities?${next.toString()}`);
    },
    [params, router],
  );

  const get = (k: string) => params.get(k) ?? '';

  // Count active filters to show a badge on the mobile toggle
  const activeCount = ['search', 'stage', 'status', 'clientType', 'problemOnly'].filter(
    (k) => get(k) !== '' && get(k) !== 'false',
  ).length;

  const filterControls = (
    <div className="filter-row mt-3 sm:mt-0">
      {/* Search */}
      <label className="flex flex-1 flex-col" style={{ minWidth: 180 }}>
        <span className="label">{t(locale, 'filter.search')}</span>
        <input
          id="opp-filter-search"
          className="input"
          defaultValue={get('search')}
          placeholder={t(locale, 'filter.searchPlaceholder')}
          onChange={(e) => setParam('search', e.target.value)}
        />
      </label>

      {/* Stage */}
      <label className="flex flex-col">
        <span className="label">{t(locale, 'filter.stage')}</span>
        <select
          id="opp-filter-stage"
          className="input"
          value={get('stage')}
          onChange={(e) => setParam('stage', e.target.value)}
        >
          <option value="">{t(locale, 'filter.all')}</option>
          {Object.values(OpportunityStage).map((s) => (
            <option key={s} value={s}>
              {stageLabels[locale][s]}
            </option>
          ))}
        </select>
      </label>

      {/* Status */}
      <label className="flex flex-col">
        <span className="label">{t(locale, 'filter.status')}</span>
        <select
          id="opp-filter-status"
          className="input"
          value={get('status')}
          onChange={(e) => setParam('status', e.target.value)}
        >
          <option value="">{t(locale, 'filter.all')}</option>
          {Object.values(OpportunityStatus).map((s) => (
            <option key={s} value={s}>
              {statusLabels[locale][s]}
            </option>
          ))}
        </select>
      </label>

      {/* Client type */}
      <label className="flex flex-col">
        <span className="label">{t(locale, 'filter.clientType')}</span>
        <select
          id="opp-filter-clientType"
          className="input"
          value={get('clientType')}
          onChange={(e) => setParam('clientType', e.target.value)}
        >
          <option value="">{t(locale, 'filter.all')}</option>
          {Object.values(ClientType).map((c) => (
            <option key={c} value={c}>
              {clientTypeLabels[locale][c]}
            </option>
          ))}
        </select>
      </label>

      {/* Problem only toggle */}
      <label className="flex items-center gap-2 pb-1.5">
        <input
          id="opp-filter-problemOnly"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          checked={get('problemOnly') === 'true'}
          onChange={(e) => setParam('problemOnly', e.target.checked ? 'true' : '')}
        />
        <span className="text-sm text-slate-600">{t(locale, 'filter.problemOnly')}</span>
      </label>
    </div>
  );

  return (
    <div className="filter-bar">
      {/* Mobile: toggle button */}
      <div className="flex items-center justify-between sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="btn-secondary text-sm"
          aria-expanded={mobileOpen}
        >
          {t(locale, 'action.filter')}
          {activeCount > 0 ? (
            <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
          <span aria-hidden className="ml-1 text-slate-400">
            {mobileOpen ? '▲' : '▼'}
          </span>
        </button>

        {activeCount > 0 ? (
          <button
            type="button"
            onClick={() => {
              router.push('/opportunities');
            }}
            className="text-xs text-slate-400 underline underline-offset-2 hover:text-slate-700"
          >
            {t(locale, 'action.reset')}
          </button>
        ) : null}
      </div>

      {/* Mobile: expandable controls */}
      {mobileOpen ? <div className="sm:hidden">{filterControls}</div> : null}

      {/* Desktop: always visible */}
      <div className="hidden sm:block">{filterControls}</div>
    </div>
  );
}
